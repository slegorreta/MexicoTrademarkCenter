/*
  # Seed Multilingual Email Templates (ES, DE, FR, HI, PT, JA)

  ## Summary
  Adds translations for Spanish, German, French, Hindi, Portuguese, and Japanese
  to the 4 existing email templates:
  - client_confirmation
  - client_welcome
  - staff_payment_link
  - client_status_update

  ## Notes
  - Uses UPDATE so existing EN/ZH content is never touched
  - Professional translations appropriate for a legal/trademark services context
*/

-- ── client_confirmation ───────────────────────────────────────────────────────
UPDATE email_templates SET
  subject_es = 'Confirmación de Pago e Instrucciones de Registro — {{case_number}}',
  body_es    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <div style="background:#1a2e4a;padding:24px 32px">
    <h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1>
    <p style="color:#fff;margin:4px 0 0;font-size:13px">Confirmación de Pago</p>
  </div>
  <div style="padding:32px">
    <p>Estimado/a <strong>{{client_name}}</strong>,</p>
    <p>Hemos recibido su pago correctamente. A continuación encontrará el resumen de su solicitud de registro de marca:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Número de expediente</td><td style="padding:8px">{{case_number}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Nombre de marca</td><td style="padding:8px">{{trademark_name}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Clases solicitadas</td><td style="padding:8px">{{class_count}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Honorarios de gestión</td><td style="padding:8px">USD {{service_fee}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Derechos IMPI (por clase)</td><td style="padding:8px">USD {{gov_fee_per_class}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Derechos IMPI (total)</td><td style="padding:8px">USD {{gov_fee_total}}</td></tr>
      <tr><td style="padding:8px;background:#f0c040;font-weight:bold">Total pagado</td><td style="padding:8px;font-weight:bold">USD {{amount}}</td></tr>
    </table>
    <p>Nos pondremos en contacto con usted en breve con las instrucciones de presentación ante el IMPI.</p>
    <p>Atentamente,<br><strong>Equipo de Mexico Trademark Center</strong></p>
  </div>
</div></body></html>',

  subject_de = 'Zahlungsbestätigung und Einreichungsanweisungen — {{case_number}}',
  body_de    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <div style="background:#1a2e4a;padding:24px 32px">
    <h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1>
    <p style="color:#fff;margin:4px 0 0;font-size:13px">Zahlungsbestätigung</p>
  </div>
  <div style="padding:32px">
    <p>Sehr geehrte/r <strong>{{client_name}}</strong>,</p>
    <p>Ihre Zahlung ist bei uns eingegangen. Hier ist eine Zusammenfassung Ihrer Markenanmeldung:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Aktenzeichen</td><td style="padding:8px">{{case_number}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Markenname</td><td style="padding:8px">{{trademark_name}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Beantragte Klassen</td><td style="padding:8px">{{class_count}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Servicegebühr</td><td style="padding:8px">USD {{service_fee}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">IMPI-Gebühr (je Klasse)</td><td style="padding:8px">USD {{gov_fee_per_class}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">IMPI-Gebühr (gesamt)</td><td style="padding:8px">USD {{gov_fee_total}}</td></tr>
      <tr><td style="padding:8px;background:#f0c040;font-weight:bold">Gesamtbetrag</td><td style="padding:8px;font-weight:bold">USD {{amount}}</td></tr>
    </table>
    <p>Wir werden Sie in Kürze mit den Einreichungsanweisungen beim IMPI kontaktieren.</p>
    <p>Mit freundlichen Grüßen,<br><strong>Das Team von Mexico Trademark Center</strong></p>
  </div>
</div></body></html>',

  subject_fr = 'Confirmation de paiement et instructions de dépôt — {{case_number}}',
  body_fr    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <div style="background:#1a2e4a;padding:24px 32px">
    <h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1>
    <p style="color:#fff;margin:4px 0 0;font-size:13px">Confirmation de paiement</p>
  </div>
  <div style="padding:32px">
    <p>Cher/Chère <strong>{{client_name}}</strong>,</p>
    <p>Nous avons bien reçu votre paiement. Voici un résumé de votre demande de dépôt de marque :</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Numéro de dossier</td><td style="padding:8px">{{case_number}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Nom de la marque</td><td style="padding:8px">{{trademark_name}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Classes demandées</td><td style="padding:8px">{{class_count}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Honoraires de service</td><td style="padding:8px">USD {{service_fee}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Taxes IMPI (par classe)</td><td style="padding:8px">USD {{gov_fee_per_class}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Taxes IMPI (total)</td><td style="padding:8px">USD {{gov_fee_total}}</td></tr>
      <tr><td style="padding:8px;background:#f0c040;font-weight:bold">Total payé</td><td style="padding:8px;font-weight:bold">USD {{amount}}</td></tr>
    </table>
    <p>Nous vous contacterons prochainement avec les instructions de dépôt auprès de l''IMPI.</p>
    <p>Cordialement,<br><strong>L''équipe de Mexico Trademark Center</strong></p>
  </div>
</div></body></html>',

  subject_hi = 'भुगतान पुष्टिकरण और फाइलिंग निर्देश — {{case_number}}',
  body_hi    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <div style="background:#1a2e4a;padding:24px 32px">
    <h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1>
    <p style="color:#fff;margin:4px 0 0;font-size:13px">भुगतान पुष्टिकरण</p>
  </div>
  <div style="padding:32px">
    <p>प्रिय <strong>{{client_name}}</strong>,</p>
    <p>आपका भुगतान सफलतापूर्वक प्राप्त हो गया है। आपके ट्रेडमार्क आवेदन का विवरण नीचे दिया गया है:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">केस नंबर</td><td style="padding:8px">{{case_number}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">ट्रेडमार्क नाम</td><td style="padding:8px">{{trademark_name}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">कक्षाओं की संख्या</td><td style="padding:8px">{{class_count}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">सेवा शुल्क</td><td style="padding:8px">USD {{service_fee}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">IMPI शुल्क (प्रति कक्षा)</td><td style="padding:8px">USD {{gov_fee_per_class}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">IMPI शुल्क (कुल)</td><td style="padding:8px">USD {{gov_fee_total}}</td></tr>
      <tr><td style="padding:8px;background:#f0c040;font-weight:bold">कुल भुगतान</td><td style="padding:8px;font-weight:bold">USD {{amount}}</td></tr>
    </table>
    <p>हम शीघ्र ही IMPI फाइलिंग निर्देशों के साथ आपसे संपर्क करेंगे।</p>
    <p>सधन्यवाद,<br><strong>Mexico Trademark Center टीम</strong></p>
  </div>
</div></body></html>',

  subject_pt = 'Confirmação de Pagamento e Instruções de Registro — {{case_number}}',
  body_pt    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <div style="background:#1a2e4a;padding:24px 32px">
    <h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1>
    <p style="color:#fff;margin:4px 0 0;font-size:13px">Confirmação de Pagamento</p>
  </div>
  <div style="padding:32px">
    <p>Caro(a) <strong>{{client_name}}</strong>,</p>
    <p>Recebemos seu pagamento com sucesso. Abaixo está o resumo do seu pedido de registro de marca:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Número do processo</td><td style="padding:8px">{{case_number}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Nome da marca</td><td style="padding:8px">{{trademark_name}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Classes solicitadas</td><td style="padding:8px">{{class_count}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Taxa de serviço</td><td style="padding:8px">USD {{service_fee}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">Taxa IMPI (por classe)</td><td style="padding:8px">USD {{gov_fee_per_class}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Taxa IMPI (total)</td><td style="padding:8px">USD {{gov_fee_total}}</td></tr>
      <tr><td style="padding:8px;background:#f0c040;font-weight:bold">Total pago</td><td style="padding:8px;font-weight:bold">USD {{amount}}</td></tr>
    </table>
    <p>Entraremos em contato em breve com as instruções de depósito junto ao IMPI.</p>
    <p>Atenciosamente,<br><strong>Equipe do Mexico Trademark Center</strong></p>
  </div>
</div></body></html>',

  subject_ja = '支払確認と出願手続きのご案内 — {{case_number}}',
  body_ja    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <div style="background:#1a2e4a;padding:24px 32px">
    <h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1>
    <p style="color:#fff;margin:4px 0 0;font-size:13px">支払確認</p>
  </div>
  <div style="padding:32px">
    <p><strong>{{client_name}}</strong> 様、</p>
    <p>お支払いを正常に受け付けました。商標登録申請の概要は以下のとおりです：</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">案件番号</td><td style="padding:8px">{{case_number}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">商標名</td><td style="padding:8px">{{trademark_name}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">申請クラス数</td><td style="padding:8px">{{class_count}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">サービス料</td><td style="padding:8px">USD {{service_fee}}</td></tr>
      <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold">IMPI官費（1クラスあたり）</td><td style="padding:8px">USD {{gov_fee_per_class}}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">IMPI官費（合計）</td><td style="padding:8px">USD {{gov_fee_total}}</td></tr>
      <tr><td style="padding:8px;background:#f0c040;font-weight:bold">お支払い合計</td><td style="padding:8px;font-weight:bold">USD {{amount}}</td></tr>
    </table>
    <p>近日中にIMPI出願手続きのご案内をお送りします。</p>
    <p>よろしくお願いいたします。<br><strong>Mexico Trademark Center チーム</strong></p>
  </div>
</div></body></html>'
WHERE template_key = 'client_confirmation';

-- ── client_welcome ────────────────────────────────────────────────────────────
UPDATE email_templates SET
  subject_es = 'Bienvenido/a a su Portal de Mexico Trademark Center',
  body_es    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1><p style="color:#fff;margin:4px 0 0;font-size:13px">Acceso al Portal</p></div><div style="padding:32px"><p>Estimado/a <strong>{{client_name}}</strong>,</p><p>Su cuenta del portal ha sido creada. Puede hacer un seguimiento del estado de sus marcas, descargar documentos y comunicarse con nuestro equipo en cualquier momento.</p><p style="margin:24px 0"><a href="{{reset_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Activar mi cuenta</a></p><p style="font-size:12px;color:#666">Este enlace expira en 24 horas. Si no solicitó esta cuenta, puede ignorar este mensaje.</p><p>Atentamente,<br><strong>Equipo de Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_de = 'Willkommen in Ihrem Mexico Trademark Center Portal',
  body_de    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1><p style="color:#fff;margin:4px 0 0;font-size:13px">Portalzugang</p></div><div style="padding:32px"><p>Sehr geehrte/r <strong>{{client_name}}</strong>,</p><p>Ihr Kundenkonto wurde eingerichtet. Sie können den Status Ihrer Marken verfolgen, Dokumente herunterladen und jederzeit mit unserem Team kommunizieren.</p><p style="margin:24px 0"><a href="{{reset_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Konto aktivieren</a></p><p style="font-size:12px;color:#666">Dieser Link läuft nach 24 Stunden ab.</p><p>Mit freundlichen Grüßen,<br><strong>Das Team von Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_fr = 'Bienvenue sur votre portail Mexico Trademark Center',
  body_fr    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1><p style="color:#fff;margin:4px 0 0;font-size:13px">Accès au portail</p></div><div style="padding:32px"><p>Cher/Chère <strong>{{client_name}}</strong>,</p><p>Votre compte client a été créé. Vous pouvez suivre l''état de vos marques, télécharger des documents et communiquer avec notre équipe à tout moment.</p><p style="margin:24px 0"><a href="{{reset_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Activer mon compte</a></p><p style="font-size:12px;color:#666">Ce lien expire dans 24 heures.</p><p>Cordialement,<br><strong>L''équipe de Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_hi = 'Mexico Trademark Center पोर्टल में आपका स्वागत है',
  body_hi    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1><p style="color:#fff;margin:4px 0 0;font-size:13px">पोर्टल एक्सेस</p></div><div style="padding:32px"><p>प्रिय <strong>{{client_name}}</strong>,</p><p>आपका पोर्टल खाता बना दिया गया है। आप अपनी ट्रेडमार्क स्थिति ट्रैक कर सकते हैं, दस्तावेज़ डाउनलोड कर सकते हैं और हमारी टीम से संपर्क कर सकते हैं।</p><p style="margin:24px 0"><a href="{{reset_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">खाता सक्रिय करें</a></p><p style="font-size:12px;color:#666">यह लिंक 24 घंटों में समाप्त हो जाएगा।</p><p>सधन्यवाद,<br><strong>Mexico Trademark Center टीम</strong></p></div></div></body></html>',

  subject_pt = 'Bem-vindo(a) ao Portal do Mexico Trademark Center',
  body_pt    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1><p style="color:#fff;margin:4px 0 0;font-size:13px">Acesso ao Portal</p></div><div style="padding:32px"><p>Caro(a) <strong>{{client_name}}</strong>,</p><p>Sua conta no portal foi criada. Você pode acompanhar o status das suas marcas, baixar documentos e se comunicar com nossa equipe a qualquer momento.</p><p style="margin:24px 0"><a href="{{reset_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Ativar minha conta</a></p><p style="font-size:12px;color:#666">Este link expira em 24 horas.</p><p>Atenciosamente,<br><strong>Equipe do Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_ja = 'Mexico Trademark Center ポータルへようこそ',
  body_ja    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1><p style="color:#fff;margin:4px 0 0;font-size:13px">ポータルアクセス</p></div><div style="padding:32px"><p><strong>{{client_name}}</strong> 様、</p><p>ポータルアカウントが作成されました。商標の状況の確認、書類のダウンロード、チームへのお問い合わせがいつでも可能です。</p><p style="margin:24px 0"><a href="{{reset_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">アカウントを有効化する</a></p><p style="font-size:12px;color:#666">このリンクは24時間で失効します。</p><p>よろしくお願いいたします。<br><strong>Mexico Trademark Center チーム</strong></p></div></div></body></html>'
WHERE template_key = 'client_welcome';

-- ── staff_payment_link ────────────────────────────────────────────────────────
UPDATE email_templates SET
  subject_es = 'Enlace de Pago para su Solicitud de Marca — {{case_number}}',
  body_es    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>Estimado/a <strong>{{client_name}}</strong>,</p><p>Su solicitud de marca <strong>{{trademark_name}}</strong> (Exp. {{case_number}}) está lista para proceder al pago.</p><p>Importe a pagar: <strong>USD {{amount}}</strong></p><p style="margin:24px 0"><a href="{{payment_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Proceder al Pago</a></p><p style="font-size:12px;color:#666">Si tiene alguna pregunta, responda a este correo.</p><p>Atentamente,<br><strong>Equipo de Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_de = 'Zahlungslink für Ihre Markenanmeldung — {{case_number}}',
  body_de    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>Sehr geehrte/r <strong>{{client_name}}</strong>,</p><p>Ihre Markenanmeldung <strong>{{trademark_name}}</strong> (Az. {{case_number}}) ist zur Zahlung bereit.</p><p>Zu zahlender Betrag: <strong>USD {{amount}}</strong></p><p style="margin:24px 0"><a href="{{payment_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Zur Zahlung</a></p><p>Mit freundlichen Grüßen,<br><strong>Das Team von Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_fr = 'Lien de paiement pour votre dépôt de marque — {{case_number}}',
  body_fr    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>Cher/Chère <strong>{{client_name}}</strong>,</p><p>Votre dépôt de marque <strong>{{trademark_name}}</strong> (Dossier {{case_number}}) est prêt pour le paiement.</p><p>Montant à payer : <strong>USD {{amount}}</strong></p><p style="margin:24px 0"><a href="{{payment_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Procéder au paiement</a></p><p>Cordialement,<br><strong>L''équipe de Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_hi = 'आपकी ट्रेडमार्क अर्जी के लिए भुगतान लिंक — {{case_number}}',
  body_hi    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>प्रिय <strong>{{client_name}}</strong>,</p><p>आपकी ट्रेडमार्क अर्जी <strong>{{trademark_name}}</strong> (केस {{case_number}}) भुगतान के लिए तैयार है।</p><p>देय राशि: <strong>USD {{amount}}</strong></p><p style="margin:24px 0"><a href="{{payment_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">भुगतान करें</a></p><p>सधन्यवाद,<br><strong>Mexico Trademark Center टीम</strong></p></div></div></body></html>',

  subject_pt = 'Link de Pagamento para seu Pedido de Marca — {{case_number}}',
  body_pt    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>Caro(a) <strong>{{client_name}}</strong>,</p><p>Seu pedido de marca <strong>{{trademark_name}}</strong> (Processo {{case_number}}) está pronto para pagamento.</p><p>Valor a pagar: <strong>USD {{amount}}</strong></p><p style="margin:24px 0"><a href="{{payment_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Efetuar Pagamento</a></p><p>Atenciosamente,<br><strong>Equipe do Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_ja = '商標出願のお支払いリンク — {{case_number}}',
  body_ja    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p><strong>{{client_name}}</strong> 様、</p><p>商標出願 <strong>{{trademark_name}}</strong>（案件番号 {{case_number}}）のお支払いの準備が整いました。</p><p>お支払い金額：<strong>USD {{amount}}</strong></p><p style="margin:24px 0"><a href="{{payment_link}}" style="background:#f0c040;color:#1a2e4a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">お支払いへ進む</a></p><p>よろしくお願いいたします。<br><strong>Mexico Trademark Center チーム</strong></p></div></div></body></html>'
WHERE template_key = 'staff_payment_link';

-- ── client_status_update ──────────────────────────────────────────────────────
UPDATE email_templates SET
  subject_es = 'Actualización de su Solicitud de Marca — {{case_number}}',
  body_es    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>Estimado/a <strong>{{client_name}}</strong>,</p><p>Hay una actualización en su expediente <strong>{{case_number}}</strong> — <em>{{trademark_name}}</em>:</p><div style="background:#f9f9f9;border-left:4px solid #f0c040;padding:16px;margin:16px 0"><strong>{{update_title}}</strong><p style="margin:8px 0 0">{{update_description}}</p></div><p>Puede consultar el estado completo en su portal de cliente.</p><p>Atentamente,<br><strong>Equipo de Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_de = 'Aktualisierung Ihrer Markenanmeldung — {{case_number}}',
  body_de    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>Sehr geehrte/r <strong>{{client_name}}</strong>,</p><p>Es gibt eine Aktualisierung zu Ihrer Akte <strong>{{case_number}}</strong> — <em>{{trademark_name}}</em>:</p><div style="background:#f9f9f9;border-left:4px solid #f0c040;padding:16px;margin:16px 0"><strong>{{update_title}}</strong><p style="margin:8px 0 0">{{update_description}}</p></div><p>Den vollständigen Status können Sie in Ihrem Kundenportal einsehen.</p><p>Mit freundlichen Grüßen,<br><strong>Das Team von Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_fr = 'Mise à jour de votre dossier de marque — {{case_number}}',
  body_fr    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>Cher/Chère <strong>{{client_name}}</strong>,</p><p>Il y a une mise à jour dans votre dossier <strong>{{case_number}}</strong> — <em>{{trademark_name}}</em> :</p><div style="background:#f9f9f9;border-left:4px solid #f0c040;padding:16px;margin:16px 0"><strong>{{update_title}}</strong><p style="margin:8px 0 0">{{update_description}}</p></div><p>Vous pouvez consulter le statut complet sur votre portail client.</p><p>Cordialement,<br><strong>L''équipe de Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_hi = 'आपकी ट्रेडमार्क अर्जी में अपडेट — {{case_number}}',
  body_hi    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>प्रिय <strong>{{client_name}}</strong>,</p><p>आपके केस <strong>{{case_number}}</strong> — <em>{{trademark_name}}</em> में एक अपडेट है:</p><div style="background:#f9f9f9;border-left:4px solid #f0c040;padding:16px;margin:16px 0"><strong>{{update_title}}</strong><p style="margin:8px 0 0">{{update_description}}</p></div><p>पूरी स्थिति जांचने के लिए अपने पोर्टल पर जाएं।</p><p>सधन्यवाद,<br><strong>Mexico Trademark Center टीम</strong></p></div></div></body></html>',

  subject_pt = 'Atualização do seu Processo de Marca — {{case_number}}',
  body_pt    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p>Caro(a) <strong>{{client_name}}</strong>,</p><p>Há uma atualização no seu processo <strong>{{case_number}}</strong> — <em>{{trademark_name}}</em>:</p><div style="background:#f9f9f9;border-left:4px solid #f0c040;padding:16px;margin:16px 0"><strong>{{update_title}}</strong><p style="margin:8px 0 0">{{update_description}}</p></div><p>Consulte o status completo no seu portal do cliente.</p><p>Atenciosamente,<br><strong>Equipe do Mexico Trademark Center</strong></p></div></div></body></html>',

  subject_ja = '商標出願の進捗更新 — {{case_number}}',
  body_ja    = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="background:#1a2e4a;padding:24px 32px"><h1 style="color:#f0c040;margin:0;font-size:20px">Mexico Trademark Center</h1></div><div style="padding:32px"><p><strong>{{client_name}}</strong> 様、</p><p>案件 <strong>{{case_number}}</strong> — <em>{{trademark_name}}</em> に更新情報があります：</p><div style="background:#f9f9f9;border-left:4px solid #f0c040;padding:16px;margin:16px 0"><strong>{{update_title}}</strong><p style="margin:8px 0 0">{{update_description}}</p></div><p>詳細はお客様ポータルでご確認ください。</p><p>よろしくお願いいたします。<br><strong>Mexico Trademark Center チーム</strong></p></div></div></body></html>'
WHERE template_key = 'client_status_update';
