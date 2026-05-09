/*
  # Seed Nice Classification Classes

  Inserts all 45 Nice Classification classes with:
  - English and Chinese titles and descriptions
  - Keyword arrays for auto-classification
  - Industry arrays for category matching

  Classes 1-34: Goods
  Classes 35-45: Services
*/

INSERT INTO nice_classes (id, class_number, category, title_en, title_zh, description_en, description_zh, keywords, industries) VALUES
(1, 1, 'goods', 'Chemicals', '化学品', 'Chemicals for use in industry, science, photography, agriculture, horticulture and forestry; unprocessed artificial resins; unprocessed plastics; manures; fire extinguishing compositions; tempering and soldering preparations; chemical substances for preserving foodstuffs; tanning substances; adhesives for use in industry.', '用于工业、科学、摄影、农业、园艺和林业的化学品；未加工人造树脂；未加工塑料；肥料；灭火剂；回火和焊接制品；食品防腐用化学品；鞣剂；工业用粘合剂。', ARRAY['chemical','adhesive','fertilizer','resin','plastic','solvent','acid','catalyst','polymer','dye','pigment','coating','laboratory','reagent','industrial chemical'], ARRAY['chemical','manufacturing','agriculture','laboratory','pharmaceutical']),

(2, 2, 'goods', 'Paints, Varnishes', '涂料、清漆', 'Paints, varnishes, lacquers; preservatives against rust and against deterioration of wood; colorants; mordants; raw natural resins; metals in foil and powder form for use in painting, decorating, printing and art.', '涂料、清漆、漆；防锈剂和木材防腐剂；着色剂；媒染剂；天然树脂原料；用于绘画、装饰、印刷和艺术的金属箔和粉末。', ARRAY['paint','varnish','lacquer','coating','color','pigment','rust','primer','stain','ink','dye','finish','enamel'], ARRAY['construction','manufacturing','art','printing','automotive']),

(3, 3, 'goods', 'Cosmetics, Cleaning Products', '化妆品、洁净剂', 'Bleaching preparations and other substances for laundry use; cleaning, polishing, scouring and abrasive preparations; soaps; perfumery, essential oils, cosmetics, hair lotions; dentifrices.', '漂白剂和其他洗涤用品；清洗、抛光、去污和研磨剂；肥皂；香水、精油、化妆品、护发水；牙膏。', ARRAY['cosmetic','beauty','skincare','makeup','perfume','soap','shampoo','lotion','cream','cleanser','toothpaste','hair care','personal care','hygiene'], ARRAY['beauty','cosmetics','personal care','retail','ecommerce']),

(4, 4, 'goods', 'Fuels, Oils, Candles', '燃料、油脂、蜡烛', 'Industrial oils and greases; lubricants; dust absorbing, wetting and binding compositions; fuels and illuminants; candles and wicks for lighting.', '工业用油和油脂；润滑剂；除尘、湿润和粘合剂；燃料和照明剂；蜡烛和灯芯。', ARRAY['fuel','oil','lubricant','grease','wax','candle','gasoline','petroleum','diesel','kerosene','coal'], ARRAY['energy','automotive','manufacturing','industrial']),

(5, 5, 'goods', 'Pharmaceuticals', '医药品', 'Pharmaceutical and veterinary preparations; sanitary preparations for medical purposes; dietetic food and substances adapted for medical or veterinary use; food supplements; plasters; materials for dressings; disinfectants; preparations for destroying vermin; fungicides, herbicides.', '药用和兽医用制剂；医疗用卫生制品；适合医疗或兽医使用的饮食食品和物质；食品补充剂；膏药；敷料材料；消毒剂；灭虫剂；杀菌剂、除草剂。', ARRAY['medicine','pharmaceutical','drug','supplement','vitamin','health','medical','veterinary','antibiotic','vaccine','disinfectant','bandage','dietary supplement','probiotic'], ARRAY['pharmaceutical','healthcare','medical','wellness','nutraceutical']),

(6, 6, 'goods', 'Metal Goods', '金属商品', 'Common metals and their alloys; metal building materials; transportable buildings of metal; non-electric cables and wires of common metal; ironmongery, small items of metal hardware; pipes and tubes of metal; safes; goods of common metal not included in other classes; ores.', '普通金属及其合金；金属建筑材料；金属可移动建筑物；非电普通金属电缆和电线；五金，小五金；金属管道；保险箱；其他类别未包含的普通金属制品；矿石。', ARRAY['metal','steel','iron','aluminum','hardware','fitting','fastener','bolt','nut','screw','pipe','tube','wire','cable','structural','alloy'], ARRAY['construction','manufacturing','hardware','industrial','mining']),

(7, 7, 'goods', 'Machinery', '机械', 'Machines and machine tools; motors and engines (except for land vehicles); machine coupling and transmission components (except for land vehicles); agricultural implements other than hand-operated; incubators for eggs; automatic vending machines.', '机器和机床；发动机和引擎（陆地车辆除外）；机器联轴器和传动部件（陆地车辆除外）；非手动农业器具；孵蛋器；自动售货机。', ARRAY['machine','motor','engine','pump','compressor','generator','robot','automation','industrial machine','manufacturing equipment','power tool','CNC','turbine'], ARRAY['manufacturing','industrial','agriculture','automation','engineering']),

(8, 8, 'goods', 'Hand Tools', '手工具', 'Hand tools and implements (hand-operated); cutlery; side arms; razors.', '手工具和器具（手动）；刀具；佩剑；剃刀。', ARRAY['tool','knife','scissors','razor','cutlery','blade','wrench','hammer','screwdriver','pliers','hand tool','kitchen tool','garden tool'], ARRAY['hardware','kitchen','garden','craft','manufacturing']),

(9, 9, 'goods', 'Electronics, Technology', '电子、科技产品', 'Scientific, nautical, surveying, photographic, cinematographic, optical, weighing, measuring, signalling, checking (supervision), life-saving and teaching apparatus and instruments; apparatus and instruments for conducting, switching, transforming, accumulating, regulating or controlling electricity; apparatus for recording, transmission or reproduction of sound or images; magnetic data carriers, recording discs; compact discs, DVDs and other digital recording media; mechanisms for coin-operated apparatus; cash registers, calculating machines, data processing equipment, computers; computer software; fire extinguishing apparatus.', '科学、航海、测量、摄影、电影、光学、称重、测量、信号、检查（监督）、救生和教学设备及仪器；导电、开关、变压、蓄电、调节或控制电力的设备及仪器；录音、传输或再现声音或图像的设备；磁性数据载体、录音盘；光盘、DVD和其他数字录制媒体；投币装置机构；收银机、计算机、数据处理设备、电脑；计算机软件；灭火设备。', ARRAY['electronic','software','computer','phone','tablet','gadget','device','sensor','camera','display','monitor','semiconductor','chip','battery','charger','cable','headphone','speaker','smart','IoT','app'], ARRAY['technology','electronics','software','ecommerce','consumer electronics','manufacturing']),

(10, 10, 'goods', 'Medical Devices', '医疗器械', 'Surgical, medical, dental and veterinary apparatus and instruments; artificial limbs, eyes and teeth; orthopedic articles; suture materials.', '外科、医疗、牙科和兽医设备及仪器；假肢、假眼和假牙；矫形器具；缝合材料。', ARRAY['medical device','surgical','dental','orthopedic','implant','prosthetic','diagnostic','therapeutic','stethoscope','syringe','bandage','medical equipment'], ARRAY['medical','healthcare','dental','pharmaceutical']),

(11, 11, 'goods', 'Lighting, Heating, Appliances', '照明、加热、卫生装置', 'Apparatus for lighting, heating, steam generating, cooking, refrigerating, drying, ventilating, water supply and sanitary purposes.', '照明、加热、蒸汽发生、烹饪、冷藏、干燥、通风、供水和卫生设备。', ARRAY['lighting','lamp','LED','heater','air conditioner','refrigerator','oven','stove','ventilation','plumbing','water heater','cooking','appliance','fixture'], ARRAY['home appliance','construction','HVAC','kitchen','lighting']),

(12, 12, 'goods', 'Vehicles', '车辆', 'Vehicles; apparatus for locomotion by land, air or water.', '车辆；陆地、空中或水上运输工具。', ARRAY['vehicle','car','truck','motorcycle','bicycle','boat','airplane','drone','electric vehicle','EV','scooter','trailer','auto'], ARRAY['automotive','transportation','aviation','marine']),

(13, 13, 'goods', 'Firearms', '枪支', 'Firearms; ammunition and projectiles; explosives; fireworks.', '枪支；弹药和抛射体；爆炸物；烟火。', ARRAY['firearm','gun','ammunition','explosive','firework','weapon','rifle','pistol'], ARRAY['defense','military','sporting','entertainment']),

(14, 14, 'goods', 'Jewelry, Watches', '珠宝首饰、钟表', 'Precious metals and their alloys and goods in precious metals or coated therewith, not included in other classes; jewellery, precious stones; horological and chronometric instruments.', '贵金属及其合金及未包括在其他类别的贵金属制品或镀贵金属制品；珠宝、宝石；计时和时间测量仪器。', ARRAY['jewelry','watch','ring','necklace','bracelet','earring','gold','silver','diamond','gem','clock','luxury','accessory'], ARRAY['luxury','jewelry','fashion','retail','ecommerce']),

(15, 15, 'goods', 'Musical Instruments', '乐器', 'Musical instruments.', '乐器。', ARRAY['musical instrument','guitar','piano','violin','drum','keyboard','synthesizer','audio equipment','music'], ARRAY['music','entertainment','education']),

(16, 16, 'goods', 'Paper, Stationery', '纸、文具', 'Paper and cardboard; printed matter; bookbinding material; photographs; stationery; adhesives for stationery or household purposes; artists'' materials; paint brushes; typewriters and office requisites (except furniture); instructional and teaching material (except apparatus); plastic materials for packaging (not included in other classes); printers'' type; printing blocks.', '纸和纸板；印刷品；装订材料；照片；文具；文具或家庭用胶水；美术材料；画笔；打字机和办公用品（家具除外）；教学材料（器械除外）；包装用塑料材料（未包括在其他类别）；印刷字体；印版。', ARRAY['paper','book','magazine','stationery','notebook','packaging','label','print','cardboard','box','envelope','poster'], ARRAY['publishing','printing','packaging','education','office','ecommerce']),

(17, 17, 'goods', 'Rubber, Plastics', '橡胶、塑料', 'Rubber, gutta-percha, gum, asbestos, mica and goods made from these materials and not included in other classes; plastics in extruded form for use in manufacture; packing, stopping and insulating materials; flexible pipes, not of metal.', '橡胶、古塔胶、树胶、石棉、云母及这些材料制成的未包括在其他类别的商品；制造用挤压塑料；填充、堵塞和绝缘材料；非金属软管。', ARRAY['rubber','plastic','silicone','insulation','seal','gasket','hose','pipe','packaging material','foam'], ARRAY['manufacturing','construction','industrial','automotive','packaging']),

(18, 18, 'goods', 'Leather, Bags', '皮革、箱包', 'Leather and imitations of leather and goods made of these materials and not included in other classes; animal skins and hides; trunks and travelling bags; umbrellas, parasols and walking sticks; whips, harness and saddlery.', '皮革和人造皮革及这些材料制成的未包括在其他类别的商品；动物皮毛；行李箱和旅行包；雨伞、遮阳伞和手杖；鞭子、马具和马鞍具。', ARRAY['bag','handbag','backpack','luggage','wallet','leather','purse','suitcase','tote','briefcase','accessory','fashion'], ARRAY['fashion','retail','ecommerce','luxury']),

(19, 19, 'goods', 'Building Materials', '建筑材料', 'Building materials (non-metallic); non-metallic rigid pipes for building; asphalt, pitch and bitumen; non-metallic transportable buildings; monuments, not of metal.', '建筑材料（非金属）；建筑用非金属硬管；沥青、沥青和柏油；非金属可移动建筑物；非金属纪念碑。', ARRAY['building material','cement','brick','tile','stone','glass','wood','lumber','flooring','roof','construction material','marble','granite'], ARRAY['construction','real estate','manufacturing','interior design']),

(20, 20, 'goods', 'Furniture', '家具', 'Furniture, mirrors, picture frames; goods of wood, cork, reed, cane, wicker, horn, bone, ivory, whalebone, shell, amber, mother-of-pearl, meerschaum and substitutes for all these materials, or of plastics.', '家具、镜子、画框；木材、软木、芦苇、藤条、柳条、角、骨、象牙、鲸骨、贝壳、琥珀、珍珠母、海泡石制品及所有这些材料的替代品制品，或塑料制品。', ARRAY['furniture','sofa','chair','table','desk','bed','shelf','cabinet','storage','home decor','office furniture','outdoor furniture'], ARRAY['furniture','interior design','retail','ecommerce','home']),

(21, 21, 'goods', 'Household Utensils', '家用器皿', 'Household or kitchen utensils and containers; cookware and tableware, except forks, knives and spoons; combs and sponges; brushes (except paint brushes); brush-making materials; articles for cleaning purposes; steelwool; unworked or semi-worked glass (except glass used in building); glassware, porcelain and earthenware.', '家用或厨房用具和容器；炊具和餐具（叉子、刀和汤匙除外）；梳子和海绵；刷子（画笔除外）；制刷材料；清洁用品；钢丝球；未加工或半加工玻璃（建筑用玻璃除外）；玻璃器皿、瓷器和陶器。', ARRAY['kitchenware','cookware','tableware','cup','bowl','plate','glass','mug','pot','pan','utensil','kitchen','household','ceramic'], ARRAY['kitchen','home','retail','ecommerce','manufacturing']),

(22, 22, 'goods', 'Ropes, Textiles', '绳索、织物', 'Ropes, string, nets, tents, awnings, tarpaulins, sails, sacks and bags (not included in other classes); padding and stuffing materials (except of rubber or plastics); raw fibrous textile materials.', '绳索、绳子、网、帐篷、遮篷、防水布、帆、麻袋和袋子（未包括在其他类别）；填充材料（橡胶或塑料除外）；原纤维纺织材料。', ARRAY['rope','cord','net','bag','sack','canvas','textile','fiber','thread','yarn'], ARRAY['manufacturing','agriculture','marine','outdoor','textile']),

(23, 23, 'goods', 'Yarns, Threads', '纱线', 'Yarns and threads, for textile use.', '纺织用纱线和线。', ARRAY['yarn','thread','textile','fabric','knitting','weaving','cotton','wool','polyester'], ARRAY['textile','fashion','manufacturing','craft']),

(24, 24, 'goods', 'Textiles, Fabrics', '织物', 'Textiles and textile goods, not included in other classes; bed covers; table covers.', '未包括在其他类别的纺织品和纺织商品；床罩；桌布。', ARRAY['fabric','textile','cloth','linen','bedding','curtain','towel','blanket','sheet','pillow','upholstery'], ARRAY['textile','home','retail','fashion','ecommerce']),

(25, 25, 'goods', 'Clothing, Footwear', '服装、鞋帽', 'Clothing, footwear, headgear.', '服装、鞋类、头饰。', ARRAY['clothing','apparel','fashion','shirt','pants','dress','shoes','sneakers','boots','hat','cap','jacket','coat','sportswear','uniform','underwear'], ARRAY['fashion','retail','ecommerce','sportswear','manufacturing']),

(26, 26, 'goods', 'Lace, Embroidery', '花边、刺绣', 'Lace and embroidery, ribbons and braid; buttons, hooks and eyes, pins and needles; artificial flowers; hair decorations; false hair.', '花边和刺绣品、缎带和穗带；扣子、挂钩和钩眼、大头针和缝针；人造花；发饰；假发。', ARRAY['embroidery','lace','button','zipper','ribbon','trim','sewing','needle','pin','fastener','textile accessory'], ARRAY['fashion','textile','craft','manufacturing']),

(27, 27, 'goods', 'Carpets, Floor Coverings', '地毯', 'Carpets, rugs, mats and matting, linoleum and other materials for covering existing floors; wall hangings (non-textile).', '地毯、小地毯、垫子和铺垫、油毡和其他地板覆盖材料；（非纺织品）挂毯。', ARRAY['carpet','rug','mat','floor','flooring','tile','vinyl','laminate','hardwood'], ARRAY['interior design','construction','retail','home']),

(28, 28, 'goods', 'Toys, Sporting Goods', '玩具、体育用品', 'Games and playthings; gymnastic and sporting articles not included in other classes; decorations for Christmas trees.', '游戏和玩具；未包括在其他类别的体操和运动用品；圣诞树装饰品。', ARRAY['toy','game','sport','fitness','outdoor','playground','puzzle','board game','video game','bicycle','gym','exercise','sporting goods','hobby'], ARRAY['toy','sports','fitness','ecommerce','retail','entertainment']),

(29, 29, 'goods', 'Meat, Fish, Food', '肉类、鱼类、食品', 'Meat, fish, poultry and game; meat extracts; preserved, frozen, dried and cooked fruits and vegetables; jellies, jams, compotes; eggs; milk and milk products; edible oils and fats.', '肉类、鱼类、禽类和野味；肉类提取物；保存、冷冻、干燥和熟制的水果和蔬菜；果冻、果酱、蜜饯；鸡蛋；牛奶和乳制品；食用油脂。', ARRAY['food','meat','fish','seafood','poultry','dairy','egg','oil','preserved food','frozen food','snack','protein','organic'], ARRAY['food','agriculture','ecommerce','retail','restaurant']),

(30, 30, 'goods', 'Coffee, Tea, Bakery', '咖啡、茶、烘焙', 'Coffee, tea, cocoa, sugar, rice, tapioca, sago, artificial coffee; flour and preparations made from cereals, bread, pastry and confectionery, ices; honey, treacle; yeast, baking-powder; salt, mustard; vinegar, sauces (condiments); spices; ice.', '咖啡、茶、可可、糖、米、木薯、西谷、人造咖啡；面粉和谷物制品、面包、糕点和糖果、冰淇淋；蜂蜜、糖浆；酵母、发酵粉；盐、芥末；醋、酱汁（调味品）；香料；冰块。', ARRAY['coffee','tea','bakery','bread','cake','cookie','snack','condiment','sauce','spice','sugar','food','beverage ingredient','noodle','pasta'], ARRAY['food','beverage','bakery','ecommerce','retail','restaurant']),

(31, 31, 'goods', 'Agriculture, Seeds', '农业、种子', 'Agricultural, horticultural and forestry products and grains not included in other classes; live animals; fresh fruits and vegetables; seeds, natural plants and flowers; foodstuffs for animals, malt.', '未包括在其他类别的农业、园艺和林业产品及谷物；活体动物；新鲜水果和蔬菜；种子、天然植物和花卉；动物食品、麦芽。', ARRAY['agriculture','seed','plant','flower','vegetable','fruit','grain','animal feed','organic','farm','horticulture','live animal'], ARRAY['agriculture','food','gardening','farming','ecommerce']),

(32, 32, 'goods', 'Beers, Beverages', '啤酒、饮料', 'Beers; mineral and aerated waters and other non-alcoholic drinks; fruit drinks and fruit juices; syrups and other preparations for making beverages.', '啤酒；矿泉水和充气水及其他不含酒精饮料；果汁饮料和果汁；糖浆和其他饮料制作制剂。', ARRAY['beer','juice','water','beverage','drink','soda','energy drink','tea drink','coffee drink','mineral water','smoothie'], ARRAY['beverage','food','ecommerce','retail','restaurant']),

(33, 33, 'goods', 'Wines, Spirits', '葡萄酒、烈酒', 'Alcoholic beverages (except beers).', '酒精饮料（啤酒除外）。', ARRAY['wine','spirits','alcohol','whiskey','vodka','rum','tequila','champagne','liqueur','sake','baijiu'], ARRAY['beverage','alcohol','food','retail','ecommerce']),

(34, 34, 'goods', 'Tobacco, Smokers'' Articles', '烟草', 'Tobacco; smokers'' articles; matches.', '烟草；吸烟用品；火柴。', ARRAY['tobacco','cigarette','cigar','pipe','lighter','match','vaping','e-cigarette'], ARRAY['tobacco','retail']),

(35, 35, 'services', 'Advertising, Business', '广告、商业', 'Advertising; business management; business administration; office functions.', '广告；企业管理；企业行政；办公室事务。', ARRAY['advertising','marketing','SEO','social media','PR','business management','consulting','accounting','HR','retail','ecommerce','distribution','wholesale','import export','Amazon','Mercado Libre','Alibaba'], ARRAY['marketing','business','ecommerce','consulting','advertising','retail','import export']),

(36, 36, 'services', 'Insurance, Finance', '保险、金融', 'Insurance; financial affairs; monetary affairs; real estate affairs.', '保险；金融事务；货币事务；房地产事务。', ARRAY['insurance','finance','banking','investment','payment','fintech','loan','mortgage','real estate','cryptocurrency','fund'], ARRAY['finance','insurance','real estate','fintech','banking']),

(37, 37, 'services', 'Building, Repair', '建筑、修理', 'Building construction; repair; installation services.', '建筑施工；修理；安装服务。', ARRAY['construction','repair','installation','maintenance','renovation','building','plumbing','electrical','HVAC'], ARRAY['construction','real estate','maintenance','industrial']),

(38, 38, 'services', 'Telecommunications', '通讯', 'Telecommunications.', '通讯。', ARRAY['telecom','internet','VPN','communication','messaging','broadcasting','streaming','5G','network','phone service'], ARRAY['technology','telecom','media','internet']),

(39, 39, 'services', 'Transport, Travel', '运输、旅行', 'Transport; packaging and storage of goods; travel arrangement.', '运输；商品包装和储存；旅行安排。', ARRAY['shipping','logistics','freight','courier','delivery','transport','travel','supply chain','warehousing','storage','import','export'], ARRAY['logistics','shipping','travel','ecommerce','supply chain']),

(40, 40, 'services', 'Treatment of Materials', '材料加工', 'Treatment of materials.', '材料加工。', ARRAY['manufacturing','processing','production','printing','engraving','custom manufacturing','OEM','fabrication','treatment','finishing'], ARRAY['manufacturing','OEM','industrial','printing']),

(41, 41, 'services', 'Education, Entertainment', '教育、娱乐', 'Education; providing of training; entertainment; sporting and cultural activities.', '教育；培训；娱乐；体育和文化活动。', ARRAY['education','training','e-learning','entertainment','sports','gaming','media','content','music','art','coaching','tutoring'], ARRAY['education','entertainment','media','sports','gaming']),

(42, 42, 'services', 'Science, Technology, Software', '科学、技术、软件', 'Scientific and technological services and research and design relating thereto; industrial analysis and research services; design and development of computer hardware and software.', '科学技术服务及与其相关的研究和设计；工业分析和研究服务；计算机硬件和软件的设计和开发。', ARRAY['software','SaaS','app development','IT','cloud','AI','machine learning','cybersecurity','data analytics','web design','programming','API','tech service'], ARRAY['technology','software','IT','AI','cloud','startup']),

(43, 43, 'services', 'Food, Beverage Services', '餐饮、住宿', 'Services for providing food and drink; temporary accommodation.', '提供食物和饮料的服务；临时住宿。', ARRAY['restaurant','cafe','hotel','food service','catering','bar','delivery','hospitality','accommodation','takeout'], ARRAY['food','hospitality','restaurant','hotel','tourism']),

(44, 44, 'services', 'Medical, Veterinary Services', '医疗、兽医', 'Medical services; veterinary services; hygienic and beauty care for human beings or animals; agriculture, horticulture and forestry services.', '医疗服务；兽医服务；人体或动物的卫生和美容护理；农业、园艺和林业服务。', ARRAY['medical','healthcare','dental','veterinary','beauty','salon','spa','wellness','telemedicine','nursing','clinic'], ARRAY['healthcare','medical','beauty','wellness','agriculture']),

(45, 45, 'services', 'Legal, Security Services', '法律、安保服务', 'Legal services; security services for the physical protection of tangible property and individuals; personal and social services rendered by others to meet the needs of individuals.', '法律服务；有形财产和个人物理保护安全服务；他人为满足个人需要提供的个人和社会服务。', ARRAY['legal','law','trademark','patent','copyright','intellectual property','security','protection','compliance','consulting','notary','arbitration'], ARRAY['legal','security','IP','consulting','compliance'])

ON CONFLICT (id) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  industries = EXCLUDED.industries;

-- Default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('price_tier_1_max', '5', 'number', 'Max applications for tier 1 pricing', false),
('price_tier_1_usd', '99', 'number', 'Price per class for 1-5 applications (USD)', true),
('price_tier_2_max', '10', 'number', 'Max applications for tier 2 pricing', false),
('price_tier_2_usd', '89', 'number', 'Price per class for 6-10 applications (USD)', true),
('price_tier_3_usd', '79', 'number', 'Price per class for 11+ applications (USD)', true),
('government_fee_usd', '1700', 'number', 'IMPI government fee per class in MXN (approx USD equivalent)', true),
('government_fee_mxn', '1706', 'number', 'IMPI government fee per class in MXN', true),
('filing_target_hours', '24', 'number', 'Filing target in business hours', true),
('email_sender_name', 'MexicoTrademarkCenter', 'string', 'Email sender display name', false),
('email_sender_address', 'info@mexicotrademarkcentertcr.com', 'string', 'Email sender address', false),
('supported_file_types', 'image/png,image/jpeg,image/jpg,image/svg+xml,application/pdf', 'string', 'Allowed MIME types for uploads', false),
('max_file_size_mb', '10', 'number', 'Maximum file size in MB', false),
('stripe_publishable_key', '', 'string', 'Stripe publishable key', false),
('reminder_days', '30,15,7,3,1', 'string', 'Deadline reminder intervals in days', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Default email templates
INSERT INTO email_templates (template_key, name_en, subject_en, body_en, subject_zh, body_zh) VALUES
('application_received', 'Application Received', 'Your Trademark Application Has Been Received — Mexico Trademark Center', 
'Dear {{client_name}},

Thank you for submitting your trademark filing with Mexico Trademark Center.

Case Number: {{case_number}}
Trademark: {{trademark_name}}
Classes: {{class_count}} class(es)

Our team will review your information, confirm classification, translate the application into Spanish, and target filing before IMPI within 24 business hours, subject to complete information and payment confirmation.

If we need any additional information, we will contact you promptly.

Best regards,
Mexico Trademark Center Team',
'您的商标申请已收到 — 墨西哥商标中心',
'尊敬的{{client_name}}，

感谢您向墨西哥商标中心提交商标注册申请。

案件编号：{{case_number}}
商标：{{trademark_name}}
类别：{{class_count}}个类别

我们的团队将审查您的信息，确认分类，将申请翻译成西班牙语，并在收到完整信息和付款确认后，在24个工作小时内向IMPI提交申请。

如需任何补充信息，我们将及时与您联系。

此致
墨西哥商标中心团队'),

('payment_received', 'Payment Received', 'Payment Confirmed — Mexico Trademark Center',
'Dear {{client_name}},

We have received your payment for trademark application {{case_number}}.

Amount: USD ${{amount}}
Payment Reference: {{payment_id}}

Our team will now proceed with reviewing and filing your trademark application before IMPI.

Best regards,
Mexico Trademark Center Team',
'付款已确认 — 墨西哥商标中心',
'尊敬的{{client_name}}，

我们已收到您商标申请{{case_number}}的付款。

金额：美元${{amount}}
付款参考：{{payment_id}}

我们的团队现在将继续审查并向IMPI提交您的商标申请。

此致
墨西哥商标中心团队'),

('filing_completed', 'Filing Completed', 'Your Trademark Has Been Filed Before IMPI — Mexico Trademark Center',
'Dear {{client_name}},

We are pleased to inform you that your trademark application has been filed before the Mexican Institute of Industrial Property (IMPI).

Case Number: {{case_number}}
Trademark: {{trademark_name}}
IMPI Application Number: {{impi_number}}
Filing Date: {{filing_date}}

You will receive updates as your application progresses through the examination process.

Best regards,
Mexico Trademark Center Team',
'您的商标已向IMPI提交 — 墨西哥商标中心',
'尊敬的{{client_name}}，

我们很高兴地通知您，您的商标申请已向墨西哥工业产权局（IMPI）提交。

案件编号：{{case_number}}
商标：{{trademark_name}}
IMPI申请号：{{impi_number}}
提交日期：{{filing_date}}

申请审查过程中，您将收到进度更新。

此致
墨西哥商标中心团队')
ON CONFLICT (template_key) DO NOTHING;
