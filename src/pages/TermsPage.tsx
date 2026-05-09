import { useLanguage } from '../context/LanguageContext';

const sectionsEn = [
  {
    title: '1. Service Description',
    body: 'MexicoTrademarkCenter.com provides trademark application preparation and filing services before the Mexican Institute of Industrial Property (IMPI). We are an independent filing service and are not affiliated with IMPI, any government agency, or any law firm.',
  },
  {
    title: '2. No Registration Guarantee',
    body: 'Filing an application does not guarantee trademark registration. IMPI independently examines all applications and may issue office actions, refuse registration, or allow oppositions. Our service is limited to application preparation and submission.',
  },
  {
    title: '3. Filing Timeline',
    body: 'We target filing within 24 business hours of receiving complete information and confirmed payment. This is a target, not a guarantee. Filing may be delayed if information is incomplete, payment is pending, or other circumstances arise.',
  },
  {
    title: '4. Classification',
    body: 'Nice Classification suggestions provided by our system are preliminary and subject to professional review before filing. Final classification is confirmed by our team. We are not liable for any consequences resulting from classification decisions.',
  },
  {
    title: '5. Government Fees',
    body: 'IMPI government fees are separate from our service fees and are subject to change without notice. Current fees are displayed at checkout. We remit government fees to IMPI on your behalf.',
  },
  {
    title: '6. Scope of Service',
    body: 'Our service covers application preparation and filing only. Office action responses, opposition proceedings, trademark renewals, declarations of use, litigation support, and other post-filing services are not included unless separately agreed in writing.',
  },
  {
    title: '7. Payment',
    body: 'Payment is required before we commence filing. Payments are processed via Stripe. Refunds are evaluated on a case-by-case basis before filing is initiated. No refunds after IMPI submission.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'Our liability is limited to the service fees paid. We are not liable for IMPI decisions, examination delays, third-party oppositions, or any commercial damages resulting from trademark status.',
  },
  {
    title: '9. Not Legal Advice',
    body: 'Information provided on this website and through our service is for informational purposes only and does not constitute legal advice. For legal advice regarding trademark strategy, we recommend consulting a qualified intellectual property attorney.',
  },
  {
    title: '10. Governing Law',
    body: 'These terms are governed by applicable law. Disputes shall be resolved through negotiation before any legal proceedings.',
  },
];

const sectionsZh = [
  {
    title: '1. 服务描述',
    body: 'MexicoTrademarkCenter.com在墨西哥工业产权局（IMPI）之前提供商标申请准备和提交服务。我们是独立的申请服务机构，与IMPI、任何政府机构或任何律师事务所均无关联。',
  },
  {
    title: '2. 无注册保证',
    body: '提交申请并不保证商标注册。IMPI独立审查所有申请，可能发出审查意见、拒绝注册或允许异议。我们的服务仅限于申请准备和提交。',
  },
  {
    title: '3. 申请时间表',
    body: '我们的目标是在收到完整信息和确认付款后的24个工作小时内提交。这是目标，而非保证。如果信息不完整、付款待处理或其他情况出现，申请可能会延迟。',
  },
  {
    title: '4. 分类',
    body: '我们系统提供的尼斯分类建议是初步的，在提交前需经过专业审查。最终分类由我们的团队确认。对于分类决定的任何后果，我们不承担责任。',
  },
  {
    title: '5. 政府费用',
    body: 'IMPI政府费用与我们的服务费分开，如有变化恕不另行通知。当前费用在结账时显示。我们代表您向IMPI缴纳政府费用。',
  },
  {
    title: '6. 服务范围',
    body: '我们的服务仅涵盖申请准备和提交。审查意见回应、异议程序、商标续展、使用声明、诉讼支持和其他申请后服务不包括在内，除非另行书面协议。',
  },
  {
    title: '7. 付款',
    body: '在我们开始申请之前需要付款。付款通过Stripe处理。退款在申请启动前逐案评估。IMPI提交后不予退款。',
  },
  {
    title: '8. 责任限制',
    body: '我们的责任限于已支付的服务费。对于IMPI决定、审查延迟、第三方异议或因商标状态导致的任何商业损失，我们不承担责任。',
  },
  {
    title: '9. 非法律建议',
    body: '本网站和我们服务提供的信息仅供参考，不构成法律建议。如需有关商标策略的法律建议，我们建议咨询合格的知识产权律师。',
  },
  {
    title: '10. 适用法律',
    body: '这些条款受适用法律管辖。争议应在任何法律程序之前通过协商解决。',
  },
];

const sectionsDe = [
  {
    title: '1. Leistungsbeschreibung',
    body: 'MexicoTrademarkCenter.com bietet Dienstleistungen zur Vorbereitung und Einreichung von Markenanmeldungen beim Mexikanischen Institut für gewerbliches Eigentum (IMPI). Wir sind ein unabhängiger Einreichungsservice und sind weder mit dem IMPI, einer Regierungsbehörde noch einer Anwaltskanzlei verbunden.',
  },
  {
    title: '2. Keine Garantie der Eintragung',
    body: 'Die Einreichung einer Anmeldung garantiert keine Markeneintragung. Das IMPI prüft alle Anmeldungen eigenständig und kann Amtliche Bescheide erlassen, die Eintragung ablehnen oder Widersprüche zulassen. Unser Service beschränkt sich auf die Vorbereitung und Einreichung von Anmeldungen.',
  },
  {
    title: '3. Einreichungsfrist',
    body: 'Wir streben die Einreichung innerhalb von 24 Geschäftsstunden nach Eingang vollständiger Unterlagen und bestätigter Zahlung an. Dies ist ein Ziel, keine Garantie. Die Einreichung kann verzögert sein, wenn Informationen unvollständig sind, die Zahlung aussteht oder andere Umstände eintreten.',
  },
  {
    title: '4. Klassifikation',
    body: 'Die von unserem System bereitgestellten Nizza-Klassifikationsvorschläge sind vorläufig und vor der Einreichung einer professionellen Prüfung unterworfen. Die endgültige Klassifikation wird von unserem Team bestätigt. Wir haften nicht für Folgen aus Klassifikationsentscheidungen.',
  },
  {
    title: '5. Behördengebühren',
    body: 'Die IMPI-Behördengebühren sind von unseren Servicegebühren getrennt und können sich ohne vorherige Ankündigung ändern. Die aktuellen Gebühren werden beim Checkout angezeigt. Wir überweisen die Behördengebühren in Ihrem Namen an das IMPI.',
  },
  {
    title: '6. Leistungsumfang',
    body: 'Unser Service umfasst ausschließlich die Vorbereitung und Einreichung von Anmeldungen. Antworten auf Amtliche Bescheide, Widerspruchsverfahren, Markenverlängerungen, Benutzungsnachweise, Prozessunterstützung und sonstige Leistungen nach der Einreichung sind nicht enthalten, sofern nicht schriftlich gesondert vereinbart.',
  },
  {
    title: '7. Zahlung',
    body: 'Die Zahlung ist vor Beginn der Einreichung erforderlich. Zahlungen werden über Stripe abgewickelt. Rückerstattungen werden vor dem Start der Einreichung fallweise geprüft. Nach der IMPI-Einreichung sind keine Rückerstattungen möglich.',
  },
  {
    title: '8. Haftungsbeschränkung',
    body: 'Unsere Haftung ist auf die gezahlten Servicegebühren beschränkt. Wir haften nicht für IMPI-Entscheidungen, Prüfungsverzögerungen, Widersprüche Dritter oder kommerzielle Schäden, die sich aus dem Markenstatus ergeben.',
  },
  {
    title: '9. Kein Rechtsrat',
    body: 'Die auf dieser Website und über unseren Service bereitgestellten Informationen dienen ausschließlich Informationszwecken und stellen keinen Rechtsrat dar. Für rechtliche Beratung zur Markenstrategie empfehlen wir, einen qualifizierten Anwalt für gewerblichen Rechtsschutz hinzuzuziehen.',
  },
  {
    title: '10. Anwendbares Recht',
    body: 'Diese Bedingungen unterliegen dem anwendbaren Recht. Streitigkeiten sollen vor Einleitung rechtlicher Schritte durch Verhandlungen beigelegt werden.',
  },
];

const sectionsHi = [
  {
    title: '1. सेवा विवरण',
    body: 'MexicoTrademarkCenter.com मेक्सिकन औद्योगिक संपत्ति संस्थान (IMPI) के समक्ष ट्रेडमार्क आवेदन तैयार करने और दाखिल करने की सेवाएं प्रदान करता है। हम एक स्वतंत्र दाखिल करने वाली सेवा हैं और IMPI, किसी भी सरकारी एजेंसी या किसी भी कानून फर्म से संबद्ध नहीं हैं।',
  },
  {
    title: '2. पंजीकरण की कोई गारंटी नहीं',
    body: 'आवेदन दाखिल करना ट्रेडमार्क पंजीकरण की गारंटी नहीं देता। IMPI सभी आवेदनों की स्वतंत्र रूप से जांच करता है और कार्यालय कार्रवाई जारी कर सकता है, पंजीकरण से इनकार कर सकता है, या विरोध की अनुमति दे सकता है। हमारी सेवा केवल आवेदन तैयार करने और जमा करने तक सीमित है।',
  },
  {
    title: '3. दाखिल करने की समय-सीमा',
    body: 'हमारा लक्ष्य पूरी जानकारी और भुगतान की पुष्टि प्राप्त होने के 24 व्यावसायिक घंटों के भीतर दाखिल करना है। यह एक लक्ष्य है, गारंटी नहीं। यदि जानकारी अधूरी है, भुगतान लंबित है, या अन्य परिस्थितियाँ उत्पन्न होती हैं, तो दाखिल करने में देरी हो सकती है।',
  },
  {
    title: '4. वर्गीकरण',
    body: 'हमारे सिस्टम द्वारा प्रदान किए गए नाइस वर्गीकरण सुझाव प्रारंभिक हैं और दाखिल करने से पहले पेशेवर समीक्षा के अधीन हैं। अंतिम वर्गीकरण हमारी टीम द्वारा पुष्टि की जाती है। वर्गीकरण निर्णयों से उत्पन्न किसी भी परिणाम के लिए हम उत्तरदायी नहीं हैं।',
  },
  {
    title: '5. सरकारी शुल्क',
    body: 'IMPI सरकारी शुल्क हमारी सेवा फीस से अलग हैं और बिना सूचना के परिवर्तन के अधीन हैं। वर्तमान शुल्क चेकआउट पर प्रदर्शित किए जाते हैं। हम आपकी ओर से IMPI को सरकारी शुल्क भेजते हैं।',
  },
  {
    title: '6. सेवा का दायरा',
    body: 'हमारी सेवा केवल आवेदन तैयार करने और दाखिल करने को कवर करती है। कार्यालय कार्रवाई प्रतिक्रियाएं, विरोध कार्यवाही, ट्रेडमार्क नवीकरण, उपयोग की घोषणाएं, मुकदमेबाजी सहायता और अन्य पोस्ट-फाइलिंग सेवाएं शामिल नहीं हैं जब तक अलग से लिखित रूप में सहमति न हो।',
  },
  {
    title: '7. भुगतान',
    body: 'दाखिल करना शुरू करने से पहले भुगतान आवश्यक है। भुगतान Stripe के माध्यम से संसाधित किए जाते हैं। दाखिल करने से पहले धनवापसी मामला-दर-मामला आधार पर मूल्यांकन की जाती है। IMPI सबमिशन के बाद कोई धनवापसी नहीं।',
  },
  {
    title: '8. दायित्व की सीमा',
    body: 'हमारा दायित्व भुगतान की गई सेवा फीस तक सीमित है। हम IMPI के निर्णयों, परीक्षण में देरी, तृतीय-पक्ष विरोध, या ट्रेडमार्क स्थिति से उत्पन्न किसी भी वाणिज्यिक नुकसान के लिए उत्तरदायी नहीं हैं।',
  },
  {
    title: '9. कानूनी सलाह नहीं',
    body: 'इस वेबसाइट और हमारी सेवा के माध्यम से प्रदान की गई जानकारी केवल सूचनात्मक उद्देश्यों के लिए है और कानूनी सलाह नहीं है। ट्रेडमार्क रणनीति के बारे में कानूनी सलाह के लिए, हम एक योग्य बौद्धिक संपदा वकील से परामर्श करने की सिफारिश करते हैं।',
  },
  {
    title: '10. लागू कानून',
    body: 'ये शर्तें लागू कानून द्वारा शासित हैं। किसी भी कानूनी कार्यवाही से पहले विवादों को बातचीत के माध्यम से सुलझाया जाएगा।',
  },
];

const sectionsPt = [
  {
    title: '1. Descrição do Serviço',
    body: 'MexicoTrademarkCenter.com oferece serviços de preparação e protocolo de pedidos de registro de marca perante o Instituto Mexicano de la Propiedad Industrial (IMPI). Somos um serviço de protocolo independente e não temos vínculo com o IMPI, nenhuma agência governamental ou escritório de advocacia.',
  },
  {
    title: '2. Sem Garantia de Registro',
    body: 'O protocolo de um pedido não garante o registro da marca. O IMPI examina todos os pedidos de forma independente e pode emitir exigências, recusar o registro ou admitir oposições. Nosso serviço limita-se à preparação e ao envio do pedido.',
  },
  {
    title: '3. Prazo de Protocolo',
    body: 'Visamos o protocolo em até 24 horas úteis após receber as informações completas e o pagamento confirmado. Esta é uma meta, não uma garantia. O protocolo pode ser adiado caso as informações estejam incompletas, o pagamento esteja pendente ou surjam outras circunstâncias.',
  },
  {
    title: '4. Classificação',
    body: 'As sugestões de Classificação de Nice fornecidas pelo nosso sistema são preliminares e sujeitas a revisão profissional antes do protocolo. A classificação final é confirmada pela nossa equipe. Não nos responsabilizamos por quaisquer consequências decorrentes das decisões de classificação.',
  },
  {
    title: '5. Taxas Governamentais',
    body: 'As taxas oficiais do IMPI são distintas de nossas taxas de serviço e podem ser alteradas sem aviso prévio. As taxas vigentes são exibidas no momento do pagamento. Remetemos as taxas governamentais ao IMPI em seu nome.',
  },
  {
    title: '6. Escopo do Serviço',
    body: 'Nosso serviço abrange apenas a preparação e o protocolo do pedido. Respostas a exigências, processos de oposição, renovações de marca, declarações de uso, suporte em litígios e outros serviços pós-protocolo não estão incluídos, salvo acordo separado por escrito.',
  },
  {
    title: '7. Pagamento',
    body: 'O pagamento é exigido antes de iniciarmos o protocolo. Os pagamentos são processados via Stripe. Reembolsos são avaliados caso a caso antes do início do protocolo. Não são realizados reembolsos após a submissão ao IMPI.',
  },
  {
    title: '8. Limitação de Responsabilidade',
    body: 'Nossa responsabilidade está limitada às taxas de serviço pagas. Não nos responsabilizamos por decisões do IMPI, atrasos no exame, oposições de terceiros ou quaisquer danos comerciais resultantes do status da marca.',
  },
  {
    title: '9. Não Constitui Assessoria Jurídica',
    body: 'As informações fornecidas neste website e por meio de nosso serviço têm finalidade exclusivamente informativa e não constituem assessoria jurídica. Para orientação jurídica sobre estratégia de marcas, recomendamos consultar um advogado qualificado na área de propriedade intelectual.',
  },
  {
    title: '10. Lei Aplicável',
    body: 'Estes termos são regidos pela legislação aplicável. As controvérsias deverão ser resolvidas por negociação antes de qualquer procedimento judicial.',
  },
];

const sectionsFr = [
  {
    title: '1. Description du service',
    body: 'MexicoTrademarkCenter.com propose des services de préparation et de dépôt de demandes de marques auprès de l\'Institut mexicain de la propriété industrielle (IMPI). Nous sommes un service de dépôt indépendant et ne sommes affiliés ni à l\'IMPI, ni à aucune autorité gouvernementale, ni à aucun cabinet d\'avocats.',
  },
  {
    title: '2. Aucune garantie d\'enregistrement',
    body: 'Le dépôt d\'une demande ne garantit pas l\'enregistrement de la marque. L\'IMPI examine toutes les demandes de manière indépendante et peut émettre des actions en examen, refuser l\'enregistrement ou admettre des oppositions. Notre service se limite à la préparation et au dépôt des demandes.',
  },
  {
    title: '3. Délai de dépôt',
    body: 'Notre objectif est de déposer la demande dans les 24 heures ouvrées suivant la réception des informations complètes et du paiement confirmé. Il s\'agit d\'un objectif, non d\'une garantie. Le dépôt peut être retardé si les informations sont incomplètes, si le paiement est en attente ou si d\'autres circonstances surviennent.',
  },
  {
    title: '4. Classification',
    body: 'Les suggestions de classification de Nice fournies par notre système sont préliminaires et soumises à un examen professionnel avant le dépôt. La classification finale est confirmée par notre équipe. Nous ne sommes pas responsables des conséquences résultant des décisions de classification.',
  },
  {
    title: '5. Taxes officielles',
    body: 'Les taxes officielles de l\'IMPI sont distinctes de nos frais de service et sont susceptibles de changer sans préavis. Les taxes en vigueur sont affichées lors du paiement. Nous reversons les taxes officielles à l\'IMPI en votre nom.',
  },
  {
    title: '6. Étendue du service',
    body: 'Notre service couvre uniquement la préparation et le dépôt de la demande. Les réponses aux actions en examen, les procédures d\'opposition, les renouvellements de marques, les déclarations d\'usage, le soutien en contentieux et autres services post-dépôt ne sont pas inclus, sauf accord écrit séparé.',
  },
  {
    title: '7. Paiement',
    body: 'Le paiement est requis avant que nous commencions le dépôt. Les paiements sont traités via Stripe. Les remboursements sont évalués au cas par cas avant le lancement du dépôt. Aucun remboursement après soumission à l\'IMPI.',
  },
  {
    title: '8. Limitation de responsabilité',
    body: 'Notre responsabilité est limitée aux frais de service payés. Nous ne sommes pas responsables des décisions de l\'IMPI, des retards d\'examen, des oppositions de tiers ou de tout préjudice commercial résultant du statut de la marque.',
  },
  {
    title: '9. Pas de conseil juridique',
    body: 'Les informations fournies sur ce site et par notre service sont uniquement à titre informatif et ne constituent pas un conseil juridique. Pour un conseil juridique concernant la stratégie de marque, nous recommandons de consulter un avocat spécialisé en propriété intellectuelle.',
  },
  {
    title: '10. Loi applicable',
    body: 'Ces conditions sont régies par la loi applicable. Les litiges devront être résolus par négociation avant tout recours judiciaire.',
  },
];

const sectionsEs = [
  {
    title: '1. Descripción del Servicio',
    body: 'MexicoTrademarkCenter.com proporciona servicios de preparación y presentación de solicitudes de registro de marca ante el Instituto Mexicano de la Propiedad Industrial (IMPI). Somos un servicio independiente de presentación y no tenemos ninguna afiliación con el IMPI, ninguna autoridad gubernamental ni ningún despacho de abogados.',
  },
  {
    title: '2. Sin Garantía de Registro',
    body: 'La presentación de una solicitud no garantiza el registro de la marca. El IMPI examina de forma independiente todas las solicitudes y puede emitir oficios de observaciones, denegar el registro o admitir oposiciones. Nuestro servicio se limita a la preparación y presentación de solicitudes.',
  },
  {
    title: '3. Plazo de Presentación',
    body: 'Nuestro objetivo es presentar la solicitud en 24 horas hábiles tras recibir la información completa y el pago confirmado. Este es un objetivo, no una garantía. La presentación puede retrasarse si la información está incompleta, el pago está pendiente u otras circunstancias lo impiden.',
  },
  {
    title: '4. Clasificación',
    body: 'Las sugerencias de Clasificación de Niza proporcionadas por nuestro sistema son preliminares y están sujetas a revisión profesional antes de la presentación. La clasificación final es confirmada por nuestro equipo. No somos responsables de las consecuencias derivadas de las decisiones de clasificación.',
  },
  {
    title: '5. Tasas Oficiales del IMPI',
    body: 'Las tasas oficiales del IMPI son independientes de nuestros honorarios de servicio y están sujetas a cambios sin previo aviso. Las tasas vigentes se muestran en el resumen de pago. Remitimos las tasas al IMPI en tu nombre.',
  },
  {
    title: '6. Alcance del Servicio',
    body: 'Nuestro servicio cubre únicamente la preparación y presentación de la solicitud. Las respuestas a oficios del IMPI, los procedimientos de oposición, las renovaciones de marca, las declaraciones de uso, el apoyo en litigios y otros servicios posteriores a la presentación no están incluidos, salvo acuerdo escrito por separado.',
  },
  {
    title: '7. Pago',
    body: 'El pago es requerido antes de iniciar la presentación. Los pagos se procesan vía Stripe. Los reembolsos se evalúan caso por caso antes de que se inicie la presentación. No se realizan reembolsos después de la presentación ante el IMPI.',
  },
  {
    title: '8. Limitación de Responsabilidad',
    body: 'Nuestra responsabilidad se limita a los honorarios de servicio pagados. No somos responsables de las resoluciones del IMPI, retrasos en el examen, oposiciones de terceros ni daños comerciales derivados del estado de la marca.',
  },
  {
    title: '9. No Constituye Asesoría Legal',
    body: 'La información proporcionada en este sitio web y a través de nuestro servicio es únicamente con fines informativos y no constituye asesoría legal. Para asesoría legal sobre estrategia de marcas, recomendamos consultar a un especialista en propiedad intelectual.',
  },
  {
    title: '10. Ley Aplicable',
    body: 'Estos términos se rigen por la ley aplicable. Las disputas deberán resolverse mediante negociación antes de cualquier procedimiento legal.',
  },
];

const sectionsJa = [
  {
    title: '1. サービスの説明',
    body: 'MexicoTrademarkCenter.comは、メキシコ工業所有権庁（IMPI）への商標出願の準備および申請サービスを提供します。当社は独立した申請サービスであり、IMPI、いかなる政府機関、または法律事務所とも関係がありません。',
  },
  {
    title: '2. 登録の保証なし',
    body: '出願の申請は商標登録を保証するものではありません。IMPIはすべての出願を独自に審査し、拒絶理由通知の発行、登録の拒絶、または異議申立の許可を行う場合があります。当社のサービスは出願の準備および提出に限定されます。',
  },
  {
    title: '3. 申請タイムライン',
    body: '完全な情報と支払いの確認を受け取ってから24営業時間以内の申請を目標としています。これは目標であり、保証ではありません。情報が不完全な場合、支払いが保留中の場合、またはその他の状況が生じた場合、申請が遅れる可能性があります。',
  },
  {
    title: '4. 区分の分類',
    body: '当社システムが提供するニース国際分類の提案は暫定的なものであり、申請前に専門家によるレビューが行われます。最終的な分類は当社チームが確認します。分類決定の結果に対して当社は責任を負いません。',
  },
  {
    title: '5. 政府手数料',
    body: 'IMPI政府手数料は当社のサービス料金とは別であり、予告なく変更される場合があります。現在の手数料は決済時に表示されます。当社はお客様に代わって政府手数料をIMPIに送金します。',
  },
  {
    title: '6. サービスの範囲',
    body: '当社のサービスは出願の準備および申請のみを対象としています。拒絶理由通知への対応、異議申立手続、商標更新、使用証明、訴訟支援、その他の申請後サービスは、別途書面による合意がない限り含まれません。',
  },
  {
    title: '7. お支払い',
    body: '申請手続きを開始する前にお支払いが必要です。支払いはStripeを通じて処理されます。申請開始前のキャンセルは個別に対応いたします。IMPI提出後の返金はいたしません。',
  },
  {
    title: '8. 責任の制限',
    body: '当社の責任はお支払いいただいたサービス料金に限定されます。IMPIの決定、審査の遅延、第三者による異議申立、または商標の状況に起因するいかなる商業的損害についても当社は責任を負いません。',
  },
  {
    title: '9. 法的アドバイスではない',
    body: '本ウェブサイトおよびサービスを通じて提供される情報は情報提供のみを目的としており、法的アドバイスを構成するものではありません。商標戦略に関する法的アドバイスについては、資格のある知的財産弁護士への相談をお勧めします。',
  },
  {
    title: '10. 準拠法',
    body: '本規約は適用法令に準拠します。紛争は法的手続きに先立ち、交渉により解決されるものとします。',
  },
];

export default function TermsPage() {
  const { language } = useLanguage();

  const sections = language === 'zh' ? sectionsZh : language === 'es' ? sectionsEs : language === 'de' ? sectionsDe : language === 'fr' ? sectionsFr : language === 'hi' ? sectionsHi : language === 'pt' ? sectionsPt : language === 'ja' ? sectionsJa : sectionsEn;

  const heading = language === 'zh' ? '服务条款' : language === 'es' ? 'Términos de Servicio' : language === 'de' ? 'Nutzungsbedingungen' : language === 'fr' ? 'Conditions d\'utilisation' : language === 'hi' ? 'सेवा की शर्तें' : language === 'pt' ? 'Termos de Serviço' : language === 'ja' ? '利用規約' : 'Terms of Service';
  const updated = language === 'zh' ? '最后更新：2025年1月' : language === 'es' ? 'Última actualización: enero de 2025' : language === 'de' ? 'Letzte Aktualisierung: Januar 2025' : language === 'fr' ? 'Dernière mise à jour : janvier 2025' : language === 'hi' ? 'अंतिम अद्यतन: जनवरी 2025' : language === 'pt' ? 'Última atualização: janeiro de 2025' : language === 'ja' ? '最終更新：2025年1月' : 'Last updated: January 2025';
  const notice = language === 'zh'
    ? '重要：本平台与IMPI、任何政府机构或任何律师事务所均无关联。申请不保证注册。'
    : language === 'es'
    ? 'Importante: Esta plataforma no tiene afiliación con el IMPI, ninguna autoridad gubernamental ni ningún despacho de abogados. La presentación no garantiza el registro.'
    : language === 'de'
    ? 'Wichtig: Diese Plattform ist nicht mit dem IMPI, einer Regierungsbehörde oder einer Anwaltskanzlei verbunden. Die Einreichung garantiert keine Eintragung.'
    : language === 'fr'
    ? 'Important : Cette plateforme n\'est pas affiliée à l\'IMPI, à aucune autorité gouvernementale ni à aucun cabinet d\'avocats. Le dépôt ne garantit pas l\'enregistrement.'
    : language === 'hi'
    ? 'महत्वपूर्ण: यह प्लेटफ़ॉर्म IMPI, किसी सरकारी प्राधिकरण या किसी कानून फर्म से संबद्ध नहीं है। दाखिल करना पंजीकरण की गारंटी नहीं देता।'
    : language === 'pt'
    ? 'Importante: Esta plataforma não tem vínculo com o IMPI, nenhuma autoridade governamental ou escritório de advocacia. O protocolo não garante o registro.'
    : language === 'ja'
    ? '重要：本プラットフォームはIMPI、いかなる政府機関または法律事務所とも関係がありません。出願は登録を保証するものではありません。'
    : 'Important: This platform is not affiliated with IMPI, any government authority, or any law firm. Filing does not guarantee registration.';

  return (
    <div className="bg-white">
      <section className="bg-navy-950 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl lg:text-3xl font-bold">{heading}</h1>
          <p className="text-gray-400 text-sm mt-2">{updated}</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="border-b border-gray-100 pb-6 last:border-0">
              <h2 className="text-base font-bold text-navy-900 mb-2">{section.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
            <strong>{notice}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
