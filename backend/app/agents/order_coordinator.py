from ..config import get_settings
from fastapi import HTTPException
from ..models.schemas import AgentTrace, Order, TraceLog
from ..services.email import send_delivery_email, send_rejection_email


def order_trace(order: Order, action: str = "created") -> AgentTrace:
    is_created = action == "created"
    return AgentTrace(
        agentName="Order Coordinator", agentIcon="AI", status="active",
        lastAction=f"Order {order.id} {('queued for approval' if is_created else order.status)}", lastRun="just now",
        logs=[
            TraceLog(timestamp="00:00.000", type="trigger", text=f"Order {action}: {order.id}"),
            TraceLog(timestamp="00:00.100", type="reasoning", text="Validated order data and product prices"),
            TraceLog(timestamp="00:00.200", type="guardrail", text="Manager approval required before confirmation"),
            TraceLog(timestamp="00:00.300", type="result", text=f"Order status is {order.status}"),
        ],
    )


def delivery_trace(order: Order, email_result: str) -> AgentTrace:
    return AgentTrace(
        agentName="Order Coordinator", agentIcon="AI", status="active",
        lastAction=f"Order {order.id} delivered; email {email_result}", lastRun="just now",
        logs=[
            TraceLog(timestamp="00:00.000", type="trigger", text=f"Delivery completion requested: {order.id}"),
            TraceLog(timestamp="00:00.100", type="guardrail", text="Verified the order was approved by a manager"),
            TraceLog(timestamp="00:00.200", type="action", text="Changed order status to delivered"),
            TraceLog(timestamp="00:00.300", type="action", text=f"Delivery email {email_result}"),
            TraceLog(timestamp="00:00.400", type="result", text="Delivery process is done"),
        ],
    )


def rejection_trace(order: Order, email_result: str) -> AgentTrace:
    return AgentTrace(
        agentName="Order Coordinator", agentIcon="AI", status="active",
        lastAction=f"Order {order.id} rejected; apology email {email_result}", lastRun="just now",
        logs=[
            TraceLog(timestamp="00:00.000", type="trigger", text=f"Manager rejected order: {order.id}"),
            TraceLog(timestamp="00:00.100", type="guardrail", text="Recorded the manager's rejection decision"),
            TraceLog(timestamp="00:00.200", type="action", text=f"Burmese apology email {email_result}"),
            TraceLog(timestamp="00:00.300", type="result", text="Customer rejection notification processed"),
        ],
    )


def notify_rejection(repo, order: Order) -> None:
    """Send one Burmese apology email without changing rejection semantics."""
    settings = get_settings()
    try:
        outbox_id, outbox_status = repo.queue_rejection_email(order)
    except Exception:
        try:
            repo.add_trace(rejection_trace(order, "could not be queued"))
        except Exception:
            pass
        return

    email_result = "not sent because SMTP is disabled"
    if outbox_status == "sent":
        email_result = "already sent"
    elif settings.use_mock_data:
        repo.complete_delivery_email(outbox_id, f"mock:{order.id}:rejected")
        email_result = "sent"
    elif settings.email_enabled and settings.smtp_configured:
        try:
            provider_message_id = send_rejection_email(order, settings)
            email_result = "sent"
        except Exception as exc:
            try:
                repo.fail_delivery_email(outbox_id, str(exc))
            except Exception:
                pass
            email_result = "failed and recorded for retry"
        else:
            try:
                repo.complete_delivery_email(outbox_id, provider_message_id)
            except Exception:
                email_result = "sent; outbox confirmation could not be recorded"

    try:
        repo.add_trace(rejection_trace(order, email_result))
    except Exception:
        # Notification/audit failures must not undo the manager's rejection.
        pass


def complete_delivery(repo, order_id: str) -> Order:
    """Run the guarded, deterministic delivery workflow."""
    settings = get_settings()
    if not settings.use_mock_data and (not settings.email_enabled or not settings.smtp_configured):
        raise HTTPException(status_code=503, detail="Delivery email is not configured; order remains approved")

    order = repo.mark_delivered(order_id)
    try:
        outbox_id, outbox_status = repo.queue_delivery_email(order)
    except Exception:
        repo.restore_approved(order.id)
        raise
    email_result = "sent"

    if outbox_status == "sent":
        email_result = "already sent"
    elif settings.use_mock_data:
        repo.complete_delivery_email(outbox_id, f"mock:{order.id}")
    else:
        try:
            provider_message_id = send_delivery_email(order, settings)
        except Exception as exc:
            repo.fail_delivery_email(outbox_id, str(exc))
            repo.restore_approved(order.id)
            repo.add_trace(delivery_trace(order, "failed; order restored to approved"))
            raise HTTPException(
                status_code=502,
                detail="Delivery email failed; order remains approved. Check the email outbox error.",
            ) from exc
        try:
            repo.complete_delivery_email(outbox_id, provider_message_id)
        except Exception:
            # SMTP already accepted the message. Never retry and risk sending a
            # duplicate merely because recording the provider ID failed.
            email_result = "sent; outbox confirmation could not be recorded"

    repo.add_trace(delivery_trace(order, email_result))
    return order
