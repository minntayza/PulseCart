from ..models.schemas import AgentTrace, Order, TraceLog


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
