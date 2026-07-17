from email.message import EmailMessage
from html import escape
import smtplib

from ..config import Settings
from ..models.schemas import Order


def delivery_email_html(order: Order) -> str:
    items = "".join(
        f"<li>{escape(item.product.name)} &times; {item.quantity} &mdash; ${item.lineTotal:.2f}</li>"
        for item in order.items
    )
    return (
        '<div lang="my" style="font-family: Arial, sans-serif; line-height: 1.7; color: #202124">'
        "<h1>ပစ္စည်းပို့ဆောင်ရန် Delivery အပ်နှံလိုက်ပါပြီ</h1>"
        f"<p>မင်္ဂလာပါ {escape(order.customerName)}၊</p>"
        f"<p>သင်၏ PulseCart အော်ဒါ <strong>{escape(order.id)}</strong> ကို "
        "အောင်မြင်စွာ ပို့ဆောင်နေပါပြီ။</p>"
        "<h2>မှာယူထားသည့် ပစ္စည်းများ</h2>"
        f"<ul>{items}</ul>"
        f"<p>စုစုပေါင်းကျသင့်ငွေ — <strong>${order.total:.2f}</strong></p>"
        f"<p>ပို့ဆောင်သည့်လိပ်စာ — {escape(order.address)}</p>"
        "<p>PulseCart တွင် ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။</p>"
        "</div>"
    )


def send_delivery_email(order: Order, settings: Settings) -> str:
    if not settings.email_enabled:
        raise RuntimeError("Email sending is disabled")
    if not settings.smtp_configured or not order.customerEmail:
        raise RuntimeError("SMTP or customer email is not configured")

    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = order.customerEmail
    message["Subject"] = f"PulseCart အော်ဒါ {order.id} ပို့ဆောင်ပြီးပါပြီ"
    plain_items = "\n".join(
        f"- {item.product.name} × {item.quantity} — ${item.lineTotal:.2f}"
        for item in order.items
    )
    message.set_content(
        f"မင်္ဂလာပါ {order.customerName}၊\n\n"
        "ပစ္စည်းပို့ဆောင်ရန် Delivery အပ်နှံလိုက်ပါပြီ။\n\n"
        f"သင်၏ PulseCart အော်ဒါ {order.id} ကို အောင်မြင်စွာ ပို့ဆောင်နေပါပြီ။\n\n"
        f"မှာယူထားသည့် ပစ္စည်းများ\n{plain_items}\n\n"
        f"စုစုပေါင်းကျသင့်ငွေ — ${order.total:.2f}\n"
        f"ပို့ဆောင်သည့်လိပ်စာ — {order.address}\n\n"
        "PulseCart တွင် ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။"
    )
    message.add_alternative(delivery_email_html(order), subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password or "")
        refused = server.send_message(message)
        if refused:
            raise RuntimeError(f"SMTP refused recipients: {', '.join(refused)}")
    return message["Message-ID"] or f"smtp:{order.id}"


def rejection_email_html(order: Order) -> str:
    items = "".join(
        f"<li>{escape(item.product.name)} &times; {item.quantity} &mdash; ${item.lineTotal:.2f}</li>"
        for item in order.items
    )
    return (
        '<div lang="my" style="font-family: Arial, sans-serif; line-height: 1.7; color: #202124">'
        "<h1>အော်ဒါကို လက်ခံဆောင်ရွက်ပေးနိုင်ခြင်း မရှိသည့်အတွက် တောင်းပန်အပ်ပါသည်</h1>"
        f"<p>မင်္ဂလာပါ {escape(order.customerName)}၊</p>"
        f"<p>သင်၏ PulseCart အော်ဒါ <strong>{escape(order.id)}</strong> ကို "
        "အကြောင်းအမျိုးမျိုးကြောင့် ယခုအချိန်တွင် လက်ခံဆောင်ရွက်ပေးနိုင်ခြင်း မရှိပါ။</p>"
        "<p>ယခုကဲ့သို့ အဆင်မပြေမှုဖြစ်ပေါ်စေသည့်အတွက် အနူးအညွတ်တောင်းပန်အပ်ပါသည်။</p>"
        "<h2>လက်ခံဆောင်ရွက်ပေးနိုင်ခြင်းမရှိသော ပစ္စည်းများ</h2>"
        f"<ul>{items}</ul>"
        f"<p>စုစုပေါင်းကျသင့်ငွေ — <strong>${order.total:.2f}</strong></p>"
        "<p>အခြားပစ္စည်းတစ်ခုကို ထပ်မံရွေးချယ်မှာယူနိုင်ပါသည်။ "
        "PulseCart ကို နားလည်ပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်။</p>"
        "</div>"
    )


def send_rejection_email(order: Order, settings: Settings) -> str:
    if not settings.email_enabled:
        raise RuntimeError("Email sending is disabled")
    if not settings.smtp_configured or not order.customerEmail:
        raise RuntimeError("SMTP or customer email is not configured")

    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = order.customerEmail
    message["Subject"] = f"PulseCart အော်ဒါ {order.id} ကို လက်ခံဆောင်ရွက်ပေးနိုင်ခြင်း မရှိပါ"
    plain_items = "\n".join(
        f"- {item.product.name} × {item.quantity} — ${item.lineTotal:.2f}"
        for item in order.items
    )
    message.set_content(
        f"မင်္ဂလာပါ {order.customerName}၊\n\n"
        f"သင်၏ PulseCart အော်ဒါ {order.id} ကို အကြောင်းအမျိုးမျိုးကြောင့် "
        "ယခုအချိန်တွင် လက်ခံဆောင်ရွက်ပေးနိုင်ခြင်း မရှိပါ။\n\n"
        "ယခုကဲ့သို့ အဆင်မပြေမှုဖြစ်ပေါ်စေသည့်အတွက် အနူးအညွတ်တောင်းပန်အပ်ပါသည်။\n\n"
        f"လက်ခံဆောင်ရွက်ပေးနိုင်ခြင်းမရှိသော ပစ္စည်းများ\n{plain_items}\n\n"
        f"စုစုပေါင်းကျသင့်ငွေ — ${order.total:.2f}\n\n"
        "အခြားပစ္စည်းတစ်ခုကို ထပ်မံရွေးချယ်မှာယူနိုင်ပါသည်။ "
        "PulseCart ကို နားလည်ပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်။"
    )
    message.add_alternative(rejection_email_html(order), subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password or "")
        refused = server.send_message(message)
        if refused:
            raise RuntimeError(f"SMTP refused recipients: {', '.join(refused)}")
    return message["Message-ID"] or f"smtp:{order.id}:rejected"
