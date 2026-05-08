/*
  # Seed Email Templates for Automated Flows

  Adds four email templates used by the automated filing and portal flows:
  1. client_confirmation — sent to client after payment, includes invoice summary and portal link
  2. client_welcome — sent when a portal account is created, includes password setup link
  3. staff_payment_link — sent by staff to client with a Stripe payment link
  4. client_status_update — sent when staff adds a visible timeline update with notification
*/

INSERT INTO email_templates (template_key, name_en, subject_en, body_en, subject_zh, body_zh, is_active)
VALUES
(
  'client_confirmation',
  'Payment Confirmation & Filing Instructions',
  'Your Trademark Application Has Been Received — {{case_number}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
.header h1 { color: #fff; font-size: 20px; margin: 0; letter-spacing: 0.05em; font-weight: 400; }
.header p { color: #a8c5a8; font-size: 13px; margin: 4px 0 0; }
.body { padding: 40px; }
.case-banner { background: #f0f7f0; border: 1px solid #c8e0c8; border-radius: 6px; padding: 20px 24px; margin-bottom: 32px; }
.case-banner .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a7a5a; }
.case-banner .value { font-size: 22px; font-weight: 700; color: #1a2e1a; margin-top: 4px; }
.section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #8a7a6a; border-bottom: 1px solid #e8e4de; padding-bottom: 8px; margin: 28px 0 16px; }
table.data { width: 100%; border-collapse: collapse; font-size: 14px; }
table.data td { padding: 8px 0; vertical-align: top; }
table.data td:first-child { color: #6a6a6a; width: 45%; }
table.data td:last-child { font-weight: 500; color: #1a1a1a; }
.invoice-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f0ece6; }
.invoice-total { display: flex; justify-content: space-between; padding: 14px 0 0; font-size: 16px; font-weight: 700; color: #1a2e1a; }
.cta { text-align: center; margin: 36px 0 28px; }
.cta a { background: #1a2e1a; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 0.05em; display: inline-block; }
.footer { background: #f5f3f0; padding: 24px 40px; font-size: 12px; color: #8a8a8a; text-align: center; }
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Mexico Trademark Center</h1>
    <p>Official Filing Confirmation</p>
  </div>
  <div class="body">
    <p style="font-size:15px;">Dear {{client_name}},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">Thank you for your trademark filing instruction. Your payment has been confirmed and our team has received your filing instructions. We will begin processing your application immediately.</p>

    <div class="case-banner">
      <div class="label">Your Reference Number</div>
      <div class="value">{{case_number}}</div>
    </div>

    <div class="section-title">Trademark Details</div>
    <table class="data">
      <tr><td>Mark Name</td><td>{{trademark_name}}</td></tr>
      <tr><td>Classes Filed</td><td>{{class_count}} class(es)</td></tr>
      <tr><td>Filing Date</td><td>{{filing_date}}</td></tr>
    </table>

    <div class="section-title">Payment Summary</div>
    <div class="invoice-row"><span>Professional Service Fee</span><span>USD {{service_fee}}</span></div>
    <div class="invoice-row"><span>Government Filing Fee ({{class_count}} class × USD {{gov_fee_per_class}})</span><span>USD {{gov_fee_total}}</span></div>
    <div class="invoice-total"><span>Total Paid</span><span>USD {{amount}}</span></div>

    <div class="section-title">Track Your Application</div>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">You can monitor every stage of your trademark prosecution — from filing receipt to registration certificate — through your secure client portal.</p>

    <div class="cta">
      <a href="https://mexicotrademarkcenter.com/login">Access Your Client Portal</a>
    </div>

    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">If you have any questions, you can reply to messages directly through your portal or contact us at <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a>.</p>
  </div>
  <div class="footer">
    Mexico Trademark Center &bull; Professional Trademark Filing Services &bull; Mexico<br>
    This email was sent to you because you initiated a trademark application with our firm.
  </div>
</div>
</body></html>',
  '您的商标申请已收到 — {{case_number}}',
  '<p>尊敬的{{client_name}}，</p><p>感谢您的商标申请委托。您的付款已确认，我们的团队已收到您的申请材料，将立即开始处理。</p><p>您的案件编号：<strong>{{case_number}}</strong></p><p>商标名称：{{trademark_name}}<br>申请类别：{{class_count}}类<br>申请日期：{{filing_date}}<br>实付金额：USD {{amount}}</p><p>请通过客户门户网站跟踪您的申请进度：<a href="https://mexicotrademarkcenter.com/login">访问客户门户</a></p>',
  true
),
(
  'client_welcome',
  'Client Portal Welcome',
  'Welcome to Mexico Trademark Center — Set Up Your Portal Access',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
.header h1 { color: #fff; font-size: 20px; margin: 0; letter-spacing: 0.05em; font-weight: 400; }
.body { padding: 40px; }
.cta { text-align: center; margin: 36px 0 28px; }
.cta a { background: #1a2e1a; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 0.05em; display: inline-block; }
.footer { background: #f5f3f0; padding: 24px 40px; font-size: 12px; color: #8a8a8a; text-align: center; }
</style></head>
<body>
<div class="wrapper">
  <div class="header"><h1>Mexico Trademark Center</h1></div>
  <div class="body">
    <p style="font-size:15px;">Dear {{client_name}},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">A client portal account has been created for you at Mexico Trademark Center. Through your portal you can track the status of all your trademark filings, download official documents, and communicate with our team.</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">Click the button below to set your password and access your account:</p>
    <div class="cta"><a href="{{reset_link}}">Set My Password & Sign In</a></div>
    <p style="font-size:13px;color:#6a6a6a;">This link expires in 24 hours. If you did not expect this email, please contact us at <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a>.</p>
  </div>
  <div class="footer">Mexico Trademark Center &bull; tm@mexicotrademarkcenter.com</div>
</div>
</body></html>',
  '欢迎使用墨西哥商标中心客户门户',
  '<p>尊敬的{{client_name}}，</p><p>您在墨西哥商标中心的客户账户已创建完毕。请点击以下链接设置您的密码：</p><p><a href="{{reset_link}}">设置密码并登录</a></p><p>此链接24小时内有效。</p>',
  true
),
(
  'staff_payment_link',
  'Payment Link to Client',
  'Payment Required for Your Trademark Application — {{case_number}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
.header h1 { color: #fff; font-size: 20px; margin: 0; letter-spacing: 0.05em; font-weight: 400; }
.body { padding: 40px; }
.amount-box { background: #f0f7f0; border: 1px solid #c8e0c8; border-radius: 6px; padding: 20px 24px; margin: 24px 0; text-align: center; }
.amount-box .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a7a5a; }
.amount-box .value { font-size: 28px; font-weight: 700; color: #1a2e1a; margin-top: 4px; }
.cta { text-align: center; margin: 32px 0; }
.cta a { background: #1a2e1a; color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 4px; font-size: 15px; letter-spacing: 0.05em; display: inline-block; }
.footer { background: #f5f3f0; padding: 24px 40px; font-size: 12px; color: #8a8a8a; text-align: center; }
</style></head>
<body>
<div class="wrapper">
  <div class="header"><h1>Mexico Trademark Center</h1></div>
  <div class="body">
    <p style="font-size:15px;">Dear {{client_name}},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">Your trademark application for <strong>{{trademark_name}}</strong> (Reference: {{case_number}}) has been prepared and is ready for payment. Once payment is confirmed, our team will begin the filing process immediately.</p>
    <div class="amount-box">
      <div class="label">Amount Due</div>
      <div class="value">USD {{amount}}</div>
    </div>
    <div class="cta"><a href="{{payment_link}}">Pay Securely Now</a></div>
    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">Payment is processed securely via Stripe. We accept all major credit cards. If you have any questions, reply to this email or contact us at <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a>.</p>
  </div>
  <div class="footer">Mexico Trademark Center &bull; tm@mexicotrademarkcenter.com</div>
</div>
</body></html>',
  '商标申请付款通知 — {{case_number}}',
  '<p>尊敬的{{client_name}}，</p><p>您的商标申请（<strong>{{trademark_name}}</strong>，案件编号：{{case_number}}）已准备就绪，请完成付款。</p><p>应付金额：<strong>USD {{amount}}</strong></p><p><a href="{{payment_link}}">立即安全付款</a></p>',
  true
),
(
  'client_status_update',
  'Application Status Update',
  'Update on Your Trademark Application — {{case_number}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
.header h1 { color: #fff; font-size: 20px; margin: 0; letter-spacing: 0.05em; font-weight: 400; }
.body { padding: 40px; }
.update-box { border-left: 3px solid #1a2e1a; padding: 16px 20px; background: #f8f8f6; margin: 24px 0; }
.cta { text-align: center; margin: 32px 0; }
.cta a { background: #1a2e1a; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 0.05em; display: inline-block; }
.footer { background: #f5f3f0; padding: 24px 40px; font-size: 12px; color: #8a8a8a; text-align: center; }
</style></head>
<body>
<div class="wrapper">
  <div class="header"><h1>Mexico Trademark Center</h1></div>
  <div class="body">
    <p style="font-size:15px;">Dear {{client_name}},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">There is a new update on your trademark application <strong>{{case_number}}</strong> for <strong>{{trademark_name}}</strong>:</p>
    <div class="update-box">
      <strong style="font-size:14px;">{{update_title}}</strong>
      <p style="font-size:14px;color:#4a4a4a;margin:8px 0 0;line-height:1.6;">{{update_description}}</p>
    </div>
    <div class="cta"><a href="https://mexicotrademarkcenter.com/login">View in Your Portal</a></div>
    <p style="font-size:13px;color:#6a6a6a;">Questions? Contact us at <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a></p>
  </div>
  <div class="footer">Mexico Trademark Center &bull; tm@mexicotrademarkcenter.com</div>
</div>
</body></html>',
  '商标申请状态更新 — {{case_number}}',
  '<p>尊敬的{{client_name}}，</p><p>您的商标申请（{{case_number}}）有新进展：</p><p><strong>{{update_title}}</strong></p><p>{{update_description}}</p><p><a href="https://mexicotrademarkcenter.com/login">查看门户</a></p>',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  subject_en = EXCLUDED.subject_en,
  body_en = EXCLUDED.body_en,
  subject_zh = EXCLUDED.subject_zh,
  body_zh = EXCLUDED.body_zh,
  is_active = EXCLUDED.is_active;
