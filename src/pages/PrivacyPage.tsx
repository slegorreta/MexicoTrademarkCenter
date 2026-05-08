import { useLanguage } from '../context/LanguageContext';

type Lang = 'en' | 'es' | 'zh' | 'de' | 'fr' | 'hi' | 'pt';

interface Section {
  title: string;
  paragraphs: string[];
}

interface PageContent {
  title: string;
  subtitle: string;
  intro: string;
  lastUpdated: string;
  sections: Section[];
}

const content: Record<Lang, PageContent> = {
  en: {
    title: 'Privacy Notice',
    subtitle: 'www.mexicotrademarkcenter.com',
    intro:
      'In compliance with the Federal Law on the Protection of Personal Data Held by Private Parties (Ley Federal de Protección de Datos Personales en Posesión de los Particulares, the "LFPDPPP"), published in the Official Gazette of the Federation on March 20, 2025, and its Regulations, [Legal Name of the Data Controller], with registered address at [Registered Address] (the "Controller"), as operator of the website www.mexicotrademarkcenter.com (the "Website"), issues the following Privacy Notice.',
    lastUpdated: 'Last update: May 2025',
    sections: [
      {
        title: '1. Personal Data Collected',
        paragraphs: [
          'The Controller collects the following personal data directly from the data subject: identification data (full name, nationality, date of birth, official identification); contact data (address, telephone, email); and, where applicable, fiscal data (RFC, tax domicile) and corporate data (entity name, legal representative, powers of attorney). In connection with the prosecution of trademark applications, the Controller may also process specimens, signatures, designs, and any other documentation provided by the data subject. No sensitive personal data is collected.',
        ],
      },
      {
        title: '2. Purposes of Processing',
        paragraphs: [
          'Necessary purposes (those that give rise to and are required for the performance of the legal relationship between the Controller and the data subject): (i) preparing, filing, and prosecuting trademark and other intellectual property applications, oppositions, renewals, and related procedures before the Mexican Institute of Industrial Property (IMPI) and other competent authorities; (ii) operating the online docket system through which the data subject may access information concerning the status of his/her own files; (iii) issuing invoices, managing payments, and providing legal correspondence; and (iv) complying with legal, regulatory, and contractual obligations.',
          "Voluntary purposes (not necessary for the legal relationship): sending informational and marketing communications regarding the Controller's services, client alerts, and industry updates. The data subject may object to any voluntary purpose at any time by sending an email to info@mexicotrademarkcenter.com.",
        ],
      },
      {
        title: '3. Transfers',
        paragraphs: [
          "The Controller may transfer personal data to: (i) IMPI, courts, and other competent authorities in connection with the prosecution of applications and procedures; (ii) foreign correspondents and associate counsel, where international or foreign-jurisdiction trademark prosecution is required; and (iii) service providers (hosting, IT, accounting, billing) bound by confidentiality and data protection obligations. Transfers contemplated under Article 22 of the LFPDPPP do not require the data subject's consent.",
        ],
      },
      {
        title: '4. ARCO Rights and Revocation of Consent',
        paragraphs: [
          'The data subject is entitled to access, rectify, cancel, or object to the processing of his/her personal data (ARCO rights), as well as to revoke his/her consent and to limit the use or disclosure of such data. To exercise these rights, the data subject must submit a written request to info@mexicotrademarkcenter.com containing: (i) full name and means to receive a response; (ii) documents evidencing identity or, where applicable, legal representation; (iii) a clear and precise description of the personal data and the right to be exercised; and (iv) any other element that facilitates the location of the data. The Controller will respond within the legal terms set forth in the LFPDPPP.',
        ],
      },
      {
        title: '5. Cookies and Online Docket System',
        paragraphs: [
          "The Website and its online docket system use cookies and similar technologies to authenticate users, secure access to each user's docket, and provide functionality. The data subject may disable cookies through the browser, on the understanding that doing so may limit access to the docket system.",
        ],
      },
      {
        title: '6. Changes to this Privacy Notice',
        paragraphs: [
          'Any modification to this Privacy Notice will be communicated through the Website. The data subject is responsible for periodically reviewing its content.',
        ],
      },
    ],
  },
  es: {
    title: 'Aviso de Privacidad',
    subtitle: 'www.mexicotrademarkcenter.com',
    intro:
      'En cumplimiento de lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (la "LFPDPPP"), publicada en el Diario Oficial de la Federación el 20 de marzo de 2025, y su Reglamento, [Razón Social del Responsable], con domicilio en [Domicilio] (el "Responsable"), en su carácter de operador del sitio web www.mexicotrademarkcenter.com (el "Sitio"), emite el presente Aviso de Privacidad.',
    lastUpdated: 'Última actualización: Mayo 2025',
    sections: [
      {
        title: '1. Datos Personales Recabados',
        paragraphs: [
          'El Responsable recaba directamente del titular los siguientes datos personales: datos de identificación (nombre completo, nacionalidad, fecha de nacimiento, identificación oficial); datos de contacto (domicilio, teléfono, correo electrónico); y, en su caso, datos fiscales (RFC, domicilio fiscal) y corporativos (denominación o razón social, representante legal, poderes). Para la prosecución de solicitudes marcarias, el Responsable podrá tratar también muestras, firmas, diseños y demás documentación proporcionada por el titular. No se recaban datos personales sensibles.',
        ],
      },
      {
        title: '2. Finalidades del Tratamiento',
        paragraphs: [
          'Finalidades necesarias (aquellas que dan origen y son indispensables para el cumplimiento de la relación jurídica entre el Responsable y el titular): (i) preparar, presentar y dar seguimiento a solicitudes y procedimientos de marcas y otros derechos de propiedad intelectual, oposiciones, renovaciones y trámites relacionados ante el Instituto Mexicano de la Propiedad Industrial (IMPI) y otras autoridades competentes; (ii) operar el sistema en línea de expedientes a través del cual el titular puede consultar la información correspondiente a sus propios trámites; (iii) emitir facturas, gestionar pagos y proporcionar correspondencia legal; y (iv) cumplir con obligaciones legales, regulatorias y contractuales.',
          'Finalidades voluntarias (no necesarias para la relación jurídica): envío de comunicaciones informativas y de marketing relativas a los servicios del Responsable, alertas a clientes y novedades del sector. El titular puede oponerse a cualquier finalidad voluntaria en cualquier momento mediante correo electrónico dirigido a info@mexicotrademarkcenter.com.',
        ],
      },
      {
        title: '3. Transferencias',
        paragraphs: [
          'El Responsable podrá transferir datos personales a: (i) el IMPI, tribunales y demás autoridades competentes, en el marco de la prosecución de solicitudes y procedimientos; (ii) corresponsales y abogados asociados extranjeros, cuando se requiera prosecución internacional o en jurisdicciones extranjeras; y (iii) proveedores de servicios (alojamiento, TI, contabilidad, facturación), obligados contractualmente a la confidencialidad y protección de datos. Las transferencias previstas en el artículo 22 de la LFPDPPP no requieren del consentimiento del titular.',
        ],
      },
      {
        title: '4. Derechos ARCO y Revocación del Consentimiento',
        paragraphs: [
          'El titular tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales (derechos ARCO), así como a revocar su consentimiento y limitar el uso o divulgación de los mismos. Para ejercer estos derechos, el titular deberá enviar una solicitud por escrito a info@mexicotrademarkcenter.com indicando: (i) nombre y medios para recibir respuesta; (ii) documentos que acrediten su identidad o, en su caso, representación legal; (iii) descripción clara y precisa de los datos y del derecho a ejercer; y (iv) cualquier otro elemento que facilite la localización de los datos. El Responsable atenderá la solicitud dentro de los plazos legales previstos en la LFPDPPP.',
        ],
      },
      {
        title: '5. Cookies y Sistema en Línea de Expedientes',
        paragraphs: [
          'El Sitio y su sistema en línea de expedientes utilizan cookies y tecnologías similares para autenticar a los usuarios, asegurar el acceso de cada usuario a su propio expediente y proporcionar funcionalidad. El titular puede deshabilitar las cookies a través de su navegador, en el entendido que ello podrá limitar el acceso al sistema de expedientes.',
        ],
      },
      {
        title: '6. Modificaciones al Aviso de Privacidad',
        paragraphs: [
          'Cualquier modificación al presente Aviso de Privacidad será comunicada a través del Sitio. Es responsabilidad del titular revisar periódicamente su contenido.',
        ],
      },
    ],
  },
  hi: {
    title: 'गोपनीयता नीति',
    subtitle: 'www.mexicotrademarkcenter.com',
    intro:
      'निजी पक्षों द्वारा रखे गए व्यक्तिगत डेटा के संरक्षण पर संघीय कानून (LFPDPPP) और उसके विनियमों के अनुपालन में, www.mexicotrademarkcenter.com (\'वेबसाइट\') का संचालक नियंत्रक के रूप में निम्नलिखित गोपनीयता नीति जारी करता है।',
    lastUpdated: 'अंतिम अद्यतन: मई 2025',
    sections: [
      {
        title: '1. एकत्र किए गए व्यक्तिगत डेटा',
        paragraphs: [
          'नियंत्रक सीधे डेटा विषय से निम्नलिखित व्यक्तिगत डेटा एकत्र करता है: पहचान डेटा (पूरा नाम, राष्ट्रीयता, जन्म तिथि, आधिकारिक पहचान); संपर्क डेटा (पता, फोन, ईमेल); और जहाँ लागू हो, राजकोषीय डेटा (RFC, कर पता) और कॉर्पोरेट डेटा (संस्था का नाम, कानूनी प्रतिनिधि)। ट्रेडमार्क आवेदनों के संचालन के संबंध में, नियंत्रक नमूने, हस्ताक्षर, डिज़ाइन और डेटा विषय द्वारा प्रदान किए गए किसी भी अन्य दस्तावेज़ीकरण को भी संसाधित कर सकता है। कोई संवेदनशील व्यक्तिगत डेटा एकत्र नहीं किया जाता।',
        ],
      },
      {
        title: '2. डेटा प्रसंस्करण के उद्देश्य',
        paragraphs: [
          'प्राथमिक उद्देश्य: ट्रेडमार्क आवेदन की तैयारी और दाखिल करना; IMPI के साथ संचार; कानूनी और वित्तीय दायित्वों का पालन; सेवाओं की बिलिंग और संग्रह; और डेटा विषय को ट्रेडमार्क आवेदन की स्थिति के बारे में सूचित करना।',
          'द्वितीयक उद्देश्य: संतुष्टि सर्वेक्षण; ट्रेडमार्क सेवाओं के बारे में प्रचार संचार। आप किसी भी समय द्वितीयक उद्देश्यों से ऑप्ट-आउट कर सकते हैं।',
        ],
      },
      {
        title: '3. डेटा स्थानांतरण',
        paragraphs: [
          'नियंत्रक आपके व्यक्तिगत डेटा को निम्नलिखित तृतीय पक्षों को स्थानांतरित कर सकता है: IMPI (ट्रेडमार्क आवेदन दाखिल करने के लिए); भुगतान प्रोसेसर (भुगतान करने के लिए); और IT सेवा प्रदाता (वेबसाइट संचालन के लिए)। कोई अन्य स्थानांतरण आपकी सहमति के बिना नहीं किया जाएगा।',
        ],
      },
      {
        title: '4. आपके अधिकार (ARCO)',
        paragraphs: [
          'आप अपने व्यक्तिगत डेटा तक पहुँच, सुधार, रद्दीकरण या आपत्ति (ARCO अधिकार) का प्रयोग कर सकते हैं। अनुरोध वेबसाइट पर संपर्क फ़ॉर्म के माध्यम से किए जा सकते हैं। हम 20 व्यावसायिक दिनों के भीतर जवाब देंगे।',
        ],
      },
      {
        title: '5. कुकीज़',
        paragraphs: [
          'वेबसाइट कुकीज़ और समान तकनीकों का उपयोग कर सकती है। आप अपनी ब्राउज़र सेटिंग्स के माध्यम से कुकीज़ को अक्षम कर सकते हैं।',
        ],
      },
      {
        title: '6. इस गोपनीयता नीति में परिवर्तन',
        paragraphs: [
          'नियंत्रक किसी भी समय इस गोपनीयता नीति को संशोधित कर सकता है। परिवर्तन वेबसाइट पर प्रकाशित किए जाएंगे।',
        ],
      },
    ],
  },
  fr: {
    title: 'Politique de confidentialité',
    subtitle: 'www.mexicotrademarkcenter.com',
    intro:
      'Conformément à la loi fédérale sur la protection des données personnelles détenues par des particuliers (Ley Federal de Protección de Datos Personales en Posesión de los Particulares, « LFPDPPP »), publiée au Journal officiel de la Fédération le 20 mars 2025, et à son règlement d\'application, [Dénomination sociale du responsable du traitement], dont le siège social est situé à [Adresse enregistrée] (le « Responsable »), en qualité d\'exploitant du site web www.mexicotrademarkcenter.com (le « Site »), publie la présente politique de confidentialité.',
    lastUpdated: 'Dernière mise à jour : mai 2025',
    sections: [
      {
        title: '1. Données personnelles collectées',
        paragraphs: [
          'Le Responsable collecte directement auprès de la personne concernée les données personnelles suivantes : données d\'identification (nom complet, nationalité, date de naissance, pièce d\'identité officielle) ; coordonnées (adresse, téléphone, e-mail) ; le cas échéant, données fiscales (RFC, domicile fiscal) et données d\'entreprise (dénomination sociale, représentant légal, procurations). Dans le cadre de la poursuite des demandes de marques, le Responsable peut également traiter des spécimens, signatures, designs et toute autre documentation fournie par la personne concernée. Aucune donnée personnelle sensible n\'est collectée.',
        ],
      },
      {
        title: '2. Finalités du traitement',
        paragraphs: [
          'Finalités nécessaires (celles qui fondent et sont indispensables à l\'exécution de la relation juridique entre le Responsable et la personne concernée) : (i) préparer, déposer et assurer le suivi des demandes de marques et autres droits de propriété industrielle, oppositions, renouvellements et procédures connexes auprès de l\'Institut mexicain de la propriété industrielle (IMPI) et des autres autorités compétentes ; (ii) exploiter le système de dossiers en ligne permettant à la personne concernée de consulter les informations relatives à ses propres dossiers ; (iii) émettre des factures, gérer les paiements et assurer la correspondance juridique ; et (iv) respecter les obligations légales, réglementaires et contractuelles.',
          'Finalités facultatives (non nécessaires à la relation juridique) : envoi de communications informatives et commerciales relatives aux services du Responsable, alertes clients et actualités du secteur. La personne concernée peut s\'opposer à toute finalité facultative à tout moment en adressant un e-mail à info@mexicotrademarkcenter.com.',
        ],
      },
      {
        title: '3. Transferts de données',
        paragraphs: [
          'Le Responsable peut transférer des données personnelles à : (i) l\'IMPI, les tribunaux et les autres autorités compétentes dans le cadre de la poursuite des demandes et procédures ; (ii) des correspondants étrangers et avocats associés, lorsqu\'une procédure de marque internationale ou dans des juridictions étrangères est requise ; et (iii) des prestataires de services (hébergement, informatique, comptabilité, facturation) soumis à des obligations contractuelles de confidentialité et de protection des données. Les transferts prévus à l\'article 22 de la LFPDPPP ne requièrent pas le consentement de la personne concernée.',
        ],
      },
      {
        title: '4. Droits ARCO et révocation du consentement',
        paragraphs: [
          'La personne concernée dispose du droit d\'accès, de rectification, d\'annulation et d\'opposition au traitement de ses données personnelles (droits ARCO), ainsi que du droit de révoquer son consentement et de limiter l\'utilisation ou la divulgation de ces données. Pour exercer ces droits, la personne concernée doit adresser une demande écrite à info@mexicotrademarkcenter.com en indiquant : (i) son nom complet et les moyens pour recevoir une réponse ; (ii) les documents justifiant son identité ou, le cas échéant, sa représentation légale ; (iii) une description claire et précise des données concernées et du droit à exercer ; et (iv) tout autre élément facilitant la localisation des données. Le Responsable répondra dans les délais légaux prévus par la LFPDPPP.',
        ],
      },
      {
        title: '5. Cookies et système de dossiers en ligne',
        paragraphs: [
          'Le Site et son système de dossiers en ligne utilisent des cookies et des technologies similaires pour authentifier les utilisateurs, sécuriser l\'accès de chaque utilisateur à ses propres dossiers et assurer les fonctionnalités du service. La personne concernée peut désactiver les cookies via son navigateur, étant entendu que cela peut limiter l\'accès au système de dossiers.',
        ],
      },
      {
        title: '6. Modifications de la présente politique de confidentialité',
        paragraphs: [
          'Toute modification de la présente politique de confidentialité sera communiquée via le Site. Il appartient à la personne concernée de consulter régulièrement son contenu.',
        ],
      },
    ],
  },
  de: {
    title: 'Datenschutzerklärung',
    subtitle: 'www.mexicotrademarkcenter.com',
    intro:
      'In Übereinstimmung mit dem Bundesgesetz zum Schutz personenbezogener Daten im Besitz privater Parteien (Ley Federal de Protección de Datos Personales en Posesión de los Particulares, „LFPDPPP"), veröffentlicht im Bundesanzeiger am 20. März 2025, und seinen Durchführungsbestimmungen gibt [Rechtsname des Verantwortlichen], mit eingetragenem Sitz unter [Eingetragene Adresse] (der „Verantwortliche"), als Betreiber der Website www.mexicotrademarkcenter.com (die „Website"), die folgende Datenschutzerklärung heraus.',
    lastUpdated: 'Letzte Aktualisierung: Mai 2025',
    sections: [
      {
        title: '1. Erhobene personenbezogene Daten',
        paragraphs: [
          'Der Verantwortliche erhebt die folgenden personenbezogenen Daten direkt vom Betroffenen: Identifikationsdaten (vollständiger Name, Staatsangehörigkeit, Geburtsdatum, amtlicher Lichtbildausweis); Kontaktdaten (Adresse, Telefon, E-Mail); sowie gegebenenfalls steuerliche Daten (RFC, Steuerdomizil) und Unternehmensdaten (Unternehmensbezeichnung, gesetzlicher Vertreter, Vollmachten). Im Zusammenhang mit der Verfolgung von Markenanmeldungen kann der Verantwortliche auch Muster, Unterschriften, Designs und sonstige vom Betroffenen bereitgestellte Unterlagen verarbeiten. Sensible personenbezogene Daten werden nicht erhoben.',
        ],
      },
      {
        title: '2. Verarbeitungszwecke',
        paragraphs: [
          'Notwendige Zwecke (solche, die das Rechtsverhältnis zwischen dem Verantwortlichen und dem Betroffenen begründen und für dessen Erfüllung erforderlich sind): (i) Vorbereitung, Einreichung und Verfolgung von Marken- und sonstigen gewerblichen Schutzrechtsanmeldungen, Widersprüchen, Verlängerungen und damit zusammenhängenden Verfahren beim Mexikanischen Institut für gewerbliches Eigentum (IMPI) und anderen zuständigen Behörden; (ii) Betrieb des Online-Aktensystems, über das der Betroffene Informationen zum Status seiner eigenen Dateien einsehen kann; (iii) Ausstellung von Rechnungen, Zahlungsabwicklung und rechtliche Korrespondenz; und (iv) Erfüllung gesetzlicher, regulatorischer und vertraglicher Verpflichtungen.',
          'Freiwillige Zwecke (für das Rechtsverhältnis nicht erforderlich): Versendung von Informations- und Marketingkommunikationen zu den Leistungen des Verantwortlichen, Kundenhinweisen und Branchenupdates. Der Betroffene kann jedem freiwilligen Zweck jederzeit durch eine E-Mail an info@mexicotrademarkcenter.com widersprechen.',
        ],
      },
      {
        title: '3. Datenübermittlungen',
        paragraphs: [
          'Der Verantwortliche kann personenbezogene Daten übermitteln an: (i) IMPI, Gerichte und andere zuständige Behörden im Rahmen der Verfolgung von Anmeldungen und Verfahren; (ii) ausländische Korrespondenten und assoziierte Anwälte, wenn eine internationale oder ausländische Markenanmeldung erforderlich ist; und (iii) Dienstleister (Hosting, IT, Buchhaltung, Fakturierung), die zur Vertraulichkeit und zum Datenschutz verpflichtet sind. Übermittlungen gemäß Artikel 22 LFPDPPP erfordern keine Einwilligung des Betroffenen.',
        ],
      },
      {
        title: '4. ARCO-Rechte und Widerruf der Einwilligung',
        paragraphs: [
          'Der Betroffene hat das Recht, auf seine personenbezogenen Daten zuzugreifen, sie zu berichtigen, zu löschen oder der Verarbeitung zu widersprechen (ARCO-Rechte) sowie seine Einwilligung zu widerrufen und die Nutzung oder Offenlegung dieser Daten einzuschränken. Zur Ausübung dieser Rechte muss der Betroffene einen schriftlichen Antrag an info@mexicotrademarkcenter.com senden, der Folgendes enthält: (i) vollständigen Namen und Kontaktdaten für die Antwort; (ii) Dokumente, die die Identität oder ggf. die gesetzliche Vertretung nachweisen; (iii) eine klare und genaue Beschreibung der personenbezogenen Daten und des auszuübenden Rechts; und (iv) alle sonstigen Informationen, die das Auffinden der Daten erleichtern. Der Verantwortliche antwortet innerhalb der gesetzlichen Fristen des LFPDPPP.',
        ],
      },
      {
        title: '5. Cookies und Online-Aktensystem',
        paragraphs: [
          'Die Website und ihr Online-Aktensystem verwenden Cookies und ähnliche Technologien zur Benutzerauthentifizierung, zur Sicherung des Zugriffs auf das jeweilige Aktensystem und zur Bereitstellung von Funktionalität. Der Betroffene kann Cookies über seinen Browser deaktivieren, wobei dies den Zugang zum Aktensystem einschränken kann.',
        ],
      },
      {
        title: '6. Änderungen dieser Datenschutzerklärung',
        paragraphs: [
          'Jede Änderung dieser Datenschutzerklärung wird über die Website mitgeteilt. Es liegt in der Verantwortung des Betroffenen, deren Inhalt regelmäßig zu überprüfen.',
        ],
      },
    ],
  },
  zh: {
    title: '隐私通知',
    subtitle: 'www.mexicotrademarkcenter.com',
    intro:
      '根据2025年3月20日公布于联邦官方公报之《联邦私人持有个人数据保护法》（以下简称"LFPDPPP"）及其实施条例之规定，[责任方法定名称]（注册地址：[注册地址]）（以下简称"责任方"），作为www.mexicotrademarkcenter.com网站（以下简称"本网站"）之运营方，特此发布本隐私通知。',
    lastUpdated: '最近更新日期：2025年5月',
    sections: [
      {
        title: '一、所收集之个人数据',
        paragraphs: [
          '责任方直接向数据主体收集以下个人数据：身份资料（全名、国籍、出生日期、官方身份证件）；联系资料（住址、电话、电子邮箱）；如适用，税务资料（RFC纳税人识别号、税务住所）及公司资料（公司名称、法定代表人、授权委托书）。为办理商标申请之需，责任方亦可能处理数据主体提供之样品、签名、设计及其他文件。本责任方不收集敏感个人数据。',
        ],
      },
      {
        title: '二、处理目的',
        paragraphs: [
          '必要目的（为责任方与数据主体之间法律关系之存续与履行所必需者）：（i）在墨西哥工业财产局（IMPI）及其他主管机关准备、提交并跟进商标及其他知识产权之申请、异议、续展及相关程序；（ii）运营在线案卷系统，数据主体可通过该系统查询其自身案件的状态信息；（iii）开具发票、管理款项并提供法律往来文书；（iv）履行法律、法规及合同义务。',
          '非必要目的（对法律关系非为必需者）：发送有关责任方服务之信息及营销通讯、客户提示及行业动态。数据主体可随时通过发送电子邮件至info@mexicotrademarkcenter.com反对任何非必要目的之处理。',
        ],
      },
      {
        title: '三、数据转移',
        paragraphs: [
          '责任方可能将个人数据转移至：（i）IMPI、法院及其他主管机关，以办理申请与程序；（ii）境外代理人及合作律师，如需办理国际或境外司法辖区之商标事务；（iii）服务提供商（主机托管、信息技术、会计、开票），其负有保密及数据保护之合同义务。LFPDPPP第22条所规定之转移情形，无需取得数据主体之同意。',
        ],
      },
      {
        title: '四、ARCO权利及同意之撤回',
        paragraphs: [
          '数据主体享有访问、更正、注销或反对其个人数据处理之权利（ARCO权利），并可撤回其同意及限制其个人数据之使用或披露。如欲行使上述权利，数据主体应将书面请求发送至info@mexicotrademarkcenter.com，其中应载明：（i）姓名及接收回复之方式；（ii）证明其身份或如适用其合法代表资格之文件；（iii）对相关数据及拟行使权利之清晰准确描述；（iv）任何便于定位数据之其他信息。责任方将在LFPDPPP规定之法定期限内予以回复。',
        ],
      },
      {
        title: '五、Cookies之使用及在线案卷系统',
        paragraphs: [
          '本网站及其在线案卷系统使用Cookies及类似技术，以便对用户进行身份验证、保障各用户对其自身案卷之访问并提供相关功能。数据主体可通过其浏览器禁用Cookies，但此举可能限制其访问案卷系统。',
        ],
      },
      {
        title: '六、本隐私通知之修订',
        paragraphs: [
          '本隐私通知之任何修订将通过本网站予以公告。数据主体有责任定期查阅其内容。',
        ],
      },
    ],
  },
  pt: {
    title: 'Aviso de Privacidade',
    subtitle: 'www.mexicotrademarkcenter.com',
    intro:
      'Em conformidade com a Lei Federal de Proteção de Dados Pessoais em Posse de Particulares (Ley Federal de Protección de Datos Personales en Posesión de los Particulares, a "LFPDPPP"), publicada no Diário Oficial da Federação em 20 de março de 2025, e seu Regulamento, [Razão Social do Responsável], com endereço registrado em [Endereço] (o "Responsável"), na qualidade de operador do website www.mexicotrademarkcenter.com (o "Site"), emite o presente Aviso de Privacidade.',
    lastUpdated: 'Última atualização: Maio de 2025',
    sections: [
      {
        title: '1. Dados Pessoais Coletados',
        paragraphs: [
          'O Responsável coleta diretamente do titular os seguintes dados pessoais: dados de identificação (nome completo, nacionalidade, data de nascimento, documento oficial de identificação); dados de contato (endereço, telefone, e-mail); e, quando aplicável, dados fiscais (RFC, domicílio fiscal) e corporativos (denominação social, representante legal, procurações). Para a tramitação de pedidos de registro de marca, o Responsável poderá tratar também amostras, assinaturas, designs e demais documentos fornecidos pelo titular. Não são coletados dados pessoais sensíveis.',
        ],
      },
      {
        title: '2. Finalidades do Tratamento',
        paragraphs: [
          'Finalidades necessárias (que originam e são indispensáveis para a relação jurídica entre o Responsável e o titular): (i) preparar, protocolar e tramitar pedidos de marca e outros procedimentos de propriedade intelectual, oposições, renovações e procedimentos conexos perante o Instituto Mexicano de la Propiedad Industrial (IMPI) e demais autoridades competentes; (ii) operar o sistema de acompanhamento online mediante o qual o titular pode acessar informações sobre o andamento de seus processos; (iii) emitir faturas, administrar pagamentos e fornecer correspondência jurídica; e (iv) cumprir obrigações legais, regulatórias e contratuais.',
          'Finalidades voluntárias (não necessárias para a relação jurídica): envio de comunicações informativas e de marketing sobre os serviços do Responsável, alertas para clientes e atualizações do setor. O titular pode se opor a qualquer finalidade voluntária a qualquer momento enviando um e-mail para info@mexicotrademarkcenter.com.',
        ],
      },
      {
        title: '3. Transferências',
        paragraphs: [
          'O Responsável poderá transferir dados pessoais a: (i) IMPI, tribunais e demais autoridades competentes no âmbito da tramitação de pedidos e procedimentos; (ii) correspondentes estrangeiros e advogados associados, quando se exigir tramitação de marcas em jurisdições internacionais ou estrangeiras; e (iii) prestadores de serviços (hospedagem, TI, contabilidade, faturamento) vinculados por obrigações de confidencialidade e proteção de dados. As transferências contempladas no artigo 22 da LFPDPPP não exigem o consentimento do titular.',
        ],
      },
      {
        title: '4. Direitos ARCO e Revogação do Consentimento',
        paragraphs: [
          'O titular tem direito de acessar, retificar, cancelar ou opor-se ao tratamento de seus dados pessoais (direitos ARCO), bem como de revogar seu consentimento e limitar o uso ou divulgação desses dados. Para exercer esses direitos, o titular deve enviar solicitação escrita para info@mexicotrademarkcenter.com contendo: (i) nome completo e meio para receber resposta; (ii) documentos que comprovem identidade ou, quando aplicável, representação legal; (iii) descrição clara e precisa dos dados pessoais e do direito a ser exercido; e (iv) qualquer outro elemento que facilite a localização dos dados. O Responsável responderá dentro dos prazos legais estabelecidos na LFPDPPP.',
        ],
      },
      {
        title: '5. Cookies e Sistema de Acompanhamento Online',
        paragraphs: [
          'O Site e seu sistema de acompanhamento online utilizam cookies e tecnologias similares para autenticar usuários, proteger o acesso a cada processo e fornecer funcionalidades. O titular pode desativar os cookies por meio do navegador, sabendo que isso poderá limitar o acesso ao sistema de acompanhamento.',
        ],
      },
      {
        title: '6. Alterações neste Aviso de Privacidade',
        paragraphs: [
          'Qualquer alteração neste Aviso de Privacidade será comunicada por meio do Site. O titular é responsável por revisar periodicamente seu conteúdo.',
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  const { language } = useLanguage();
  const lang: Lang = (language as Lang) in content ? (language as Lang) : 'en';
  const c = content[lang];

  return (
    <div className="bg-white">
      <section className="bg-navy-950 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl lg:text-3xl font-bold">{c.title}</h1>
          <p className="text-gray-400 text-sm mt-1 italic">{c.subtitle}</p>
          <p className="text-gray-400 text-sm mt-2">{c.lastUpdated}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600 leading-relaxed mb-10 text-sm border-l-4 border-gray-200 pl-4">
            {c.intro}
          </p>

          <div className="space-y-8">
            {c.sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-base font-bold text-navy-900 mb-3">{section.title}</h2>
                <div className="space-y-3">
                  {section.paragraphs.map((para, i) => (
                    <p key={i} className="text-gray-600 leading-relaxed text-sm">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
