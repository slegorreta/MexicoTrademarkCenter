export interface ClassSuggestion {
  classNumber: number;
  titleEn: string;
  titleZh: string;
  category: 'goods' | 'services';
  confidence: number;
  reasons: string[];
}

interface NiceClassData {
  classNumber: number;
  category: 'goods' | 'services';
  titleEn: string;
  titleZh: string;
  keywords: string[];
  industries: string[];
}

const NICE_CLASS_DATA: NiceClassData[] = [
  { classNumber: 1, category: 'goods', titleEn: 'Chemicals', titleZh: '化学品', keywords: ['chemical','adhesive','fertilizer','resin','plastic','solvent','acid','catalyst','polymer','dye','pigment','coating','laboratory','reagent','industrial chemical'], industries: ['chemical','manufacturing','agriculture','laboratory','pharmaceutical'] },
  { classNumber: 2, category: 'goods', titleEn: 'Paints, Varnishes', titleZh: '涂料、清漆', keywords: ['paint','varnish','lacquer','coating','color','pigment','rust','primer','stain','ink','dye','finish','enamel'], industries: ['construction','manufacturing','art','printing','automotive'] },
  { classNumber: 3, category: 'goods', titleEn: 'Cosmetics, Cleaning', titleZh: '化妆品、洁净剂', keywords: ['cosmetic','beauty','skincare','makeup','perfume','soap','shampoo','lotion','cream','cleanser','toothpaste','hair care','personal care','hygiene','skin'], industries: ['beauty','cosmetics','personal care','retail','ecommerce'] },
  { classNumber: 4, category: 'goods', titleEn: 'Fuels, Oils', titleZh: '燃料、油脂', keywords: ['fuel','oil','lubricant','grease','wax','candle','gasoline','petroleum','diesel','kerosene','coal'], industries: ['energy','automotive','manufacturing','industrial'] },
  { classNumber: 5, category: 'goods', titleEn: 'Pharmaceuticals', titleZh: '医药品', keywords: ['medicine','pharmaceutical','drug','supplement','vitamin','health','medical','veterinary','antibiotic','vaccine','disinfectant','bandage','dietary supplement','probiotic','nutraceutical'], industries: ['pharmaceutical','healthcare','medical','wellness','nutraceutical'] },
  { classNumber: 6, category: 'goods', titleEn: 'Metal Goods', titleZh: '金属商品', keywords: ['metal','steel','iron','aluminum','hardware','fitting','fastener','bolt','nut','screw','pipe','tube','wire','cable','structural','alloy'], industries: ['construction','manufacturing','hardware','industrial','mining'] },
  { classNumber: 7, category: 'goods', titleEn: 'Machinery', titleZh: '机械', keywords: ['machine','motor','engine','pump','compressor','generator','robot','automation','industrial machine','manufacturing equipment','power tool','cnc','turbine','equipment'], industries: ['manufacturing','industrial','agriculture','automation','engineering'] },
  { classNumber: 8, category: 'goods', titleEn: 'Hand Tools', titleZh: '手工具', keywords: ['tool','knife','scissors','razor','cutlery','blade','wrench','hammer','screwdriver','pliers','hand tool','kitchen tool','garden tool'], industries: ['hardware','kitchen','garden','craft','manufacturing'] },
  { classNumber: 9, category: 'goods', titleEn: 'Electronics, Technology', titleZh: '电子、科技产品', keywords: ['electronic','software','computer','phone','tablet','gadget','device','sensor','camera','display','monitor','semiconductor','chip','battery','charger','cable','headphone','speaker','smart','iot','app','wearable','earbuds','keyboard','mouse','router','wifi','bluetooth'], industries: ['technology','electronics','software','ecommerce','consumer electronics','manufacturing'] },
  { classNumber: 10, category: 'goods', titleEn: 'Medical Devices', titleZh: '医疗器械', keywords: ['medical device','surgical','dental','orthopedic','implant','prosthetic','diagnostic','therapeutic','stethoscope','syringe','bandage','medical equipment'], industries: ['medical','healthcare','dental','pharmaceutical'] },
  { classNumber: 11, category: 'goods', titleEn: 'Lighting, Heating, Appliances', titleZh: '照明、加热、卫生装置', keywords: ['lighting','lamp','led','heater','air conditioner','refrigerator','oven','stove','ventilation','plumbing','water heater','cooking','appliance','fixture','air purifier','humidifier'], industries: ['home appliance','construction','hvac','kitchen','lighting'] },
  { classNumber: 12, category: 'goods', titleEn: 'Vehicles', titleZh: '车辆', keywords: ['vehicle','car','truck','motorcycle','bicycle','boat','airplane','drone','electric vehicle','ev','scooter','trailer','auto','automotive'], industries: ['automotive','transportation','aviation','marine'] },
  { classNumber: 14, category: 'goods', titleEn: 'Jewelry, Watches', titleZh: '珠宝首饰、钟表', keywords: ['jewelry','watch','ring','necklace','bracelet','earring','gold','silver','diamond','gem','clock','luxury','accessory'], industries: ['luxury','jewelry','fashion','retail','ecommerce'] },
  { classNumber: 16, category: 'goods', titleEn: 'Paper, Stationery', titleZh: '纸、文具', keywords: ['paper','book','magazine','stationery','notebook','packaging','label','print','cardboard','box','envelope','poster','office supply'], industries: ['publishing','printing','packaging','education','office','ecommerce'] },
  { classNumber: 18, category: 'goods', titleEn: 'Leather, Bags', titleZh: '皮革、箱包', keywords: ['bag','handbag','backpack','luggage','wallet','leather','purse','suitcase','tote','briefcase','accessory','fashion'], industries: ['fashion','retail','ecommerce','luxury'] },
  { classNumber: 20, category: 'goods', titleEn: 'Furniture', titleZh: '家具', keywords: ['furniture','sofa','chair','table','desk','bed','shelf','cabinet','storage','home decor','office furniture','outdoor furniture'], industries: ['furniture','interior design','retail','ecommerce','home'] },
  { classNumber: 21, category: 'goods', titleEn: 'Household Utensils', titleZh: '家用器皿', keywords: ['kitchenware','cookware','tableware','cup','bowl','plate','glass','mug','pot','pan','utensil','kitchen','household','ceramic','drinkware'], industries: ['kitchen','home','retail','ecommerce','manufacturing'] },
  { classNumber: 24, category: 'goods', titleEn: 'Textiles, Fabrics', titleZh: '织物', keywords: ['fabric','textile','cloth','linen','bedding','curtain','towel','blanket','sheet','pillow','upholstery'], industries: ['textile','home','retail','fashion','ecommerce'] },
  { classNumber: 25, category: 'goods', titleEn: 'Clothing, Footwear', titleZh: '服装、鞋帽', keywords: ['clothing','apparel','fashion','shirt','pants','dress','shoes','sneakers','boots','hat','cap','jacket','coat','sportswear','uniform','underwear','garment','wear','outfit'], industries: ['fashion','retail','ecommerce','sportswear','manufacturing'] },
  { classNumber: 28, category: 'goods', titleEn: 'Toys, Sporting Goods', titleZh: '玩具、体育用品', keywords: ['toy','game','sport','fitness','outdoor','playground','puzzle','board game','video game','bicycle','gym','exercise','sporting goods','hobby'], industries: ['toy','sports','fitness','ecommerce','retail','entertainment'] },
  { classNumber: 29, category: 'goods', titleEn: 'Food Products', titleZh: '食品', keywords: ['food','meat','fish','seafood','poultry','dairy','egg','oil','preserved food','frozen food','snack','protein','organic'], industries: ['food','agriculture','ecommerce','retail','restaurant'] },
  { classNumber: 30, category: 'goods', titleEn: 'Coffee, Tea, Bakery', titleZh: '咖啡、茶、烘焙', keywords: ['coffee','tea','bakery','bread','cake','cookie','snack','condiment','sauce','spice','sugar','food','beverage ingredient','noodle','pasta','rice','grain'], industries: ['food','beverage','bakery','ecommerce','retail','restaurant'] },
  { classNumber: 32, category: 'goods', titleEn: 'Beers, Beverages', titleZh: '啤酒、饮料', keywords: ['beer','juice','water','beverage','drink','soda','energy drink','tea drink','coffee drink','mineral water','smoothie'], industries: ['beverage','food','ecommerce','retail','restaurant'] },
  { classNumber: 33, category: 'goods', titleEn: 'Wines, Spirits', titleZh: '葡萄酒、烈酒', keywords: ['wine','spirits','alcohol','whiskey','vodka','rum','tequila','champagne','liqueur','sake','baijiu'], industries: ['beverage','alcohol','food','retail','ecommerce'] },
  { classNumber: 35, category: 'services', titleEn: 'Advertising, Business', titleZh: '广告、商业', keywords: ['advertising','marketing','seo','social media','pr','business management','consulting','accounting','hr','retail','ecommerce','distribution','wholesale','import export','amazon','mercado libre','alibaba','sales','online store','marketplace'], industries: ['marketing','business','ecommerce','consulting','advertising','retail','import export'] },
  { classNumber: 36, category: 'services', titleEn: 'Insurance, Finance', titleZh: '保险、金融', keywords: ['insurance','finance','banking','investment','payment','fintech','loan','mortgage','real estate','cryptocurrency','fund'], industries: ['finance','insurance','real estate','fintech','banking'] },
  { classNumber: 38, category: 'services', titleEn: 'Telecommunications', titleZh: '通讯', keywords: ['telecom','internet','vpn','communication','messaging','broadcasting','streaming','5g','network','phone service','saas platform'], industries: ['technology','telecom','media','internet'] },
  { classNumber: 39, category: 'services', titleEn: 'Transport, Logistics', titleZh: '运输、旅行', keywords: ['shipping','logistics','freight','courier','delivery','transport','travel','supply chain','warehousing','storage','import','export','fulfilment'], industries: ['logistics','shipping','travel','ecommerce','supply chain'] },
  { classNumber: 41, category: 'services', titleEn: 'Education, Entertainment', titleZh: '教育、娱乐', keywords: ['education','training','e-learning','entertainment','sports','gaming','media','content','music','art','coaching','tutoring'], industries: ['education','entertainment','media','sports','gaming'] },
  { classNumber: 42, category: 'services', titleEn: 'Technology Services', titleZh: '科学、技术、软件', keywords: ['software','saas','app development','it','cloud','ai','machine learning','cybersecurity','data analytics','web design','programming','api','tech service','platform','website'], industries: ['technology','software','it','ai','cloud','startup'] },
  { classNumber: 43, category: 'services', titleEn: 'Food & Beverage Services', titleZh: '餐饮、住宿', keywords: ['restaurant','cafe','hotel','food service','catering','bar','delivery','hospitality','accommodation','takeout'], industries: ['food','hospitality','restaurant','hotel','tourism'] },
  { classNumber: 44, category: 'services', titleEn: 'Medical, Beauty Services', titleZh: '医疗、兽医', keywords: ['medical','healthcare','dental','veterinary','beauty','salon','spa','wellness','telemedicine','nursing','clinic'], industries: ['healthcare','medical','beauty','wellness','agriculture'] },
  { classNumber: 45, category: 'services', titleEn: 'Legal, Security Services', titleZh: '法律、安保服务', keywords: ['legal','law','trademark','patent','copyright','intellectual property','security','protection','compliance','consulting','notary','arbitration'], industries: ['legal','security','ip','consulting','compliance'] },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
}

function scoreClass(
  nc: NiceClassData,
  descWords: string[],
  industry: string,
  channels: string[]
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Keyword matching
  const matchedKeywords = nc.keywords.filter(kw =>
    descWords.some(w => w.includes(kw) || kw.includes(w))
  );
  if (matchedKeywords.length > 0) {
    score += matchedKeywords.length * 15;
    reasons.push(`Matches keywords: ${matchedKeywords.slice(0, 3).join(', ')}`);
  }

  // Industry matching
  const industryLower = normalize(industry);
  const matchedIndustries = nc.industries.filter(ind =>
    industryLower.includes(ind) || ind.includes(industryLower.split(' ')[0])
  );
  if (matchedIndustries.length > 0) {
    score += matchedIndustries.length * 20;
    reasons.push(`Industry match: ${matchedIndustries[0]}`);
  }

  // Channel signals
  const channelSignals: Record<string, number[]> = {
    'Amazon': [9, 25, 28, 35],
    'Mercado Libre': [9, 25, 28, 35],
    'Alibaba / AliExpress': [9, 25, 28, 35],
    'Shopify': [9, 25, 35],
    'Manufacturing / OEM': [7, 9, 6, 40],
  };
  for (const channel of channels) {
    if (channelSignals[channel]?.includes(nc.classNumber)) {
      score += 10;
      reasons.push(`Common for ${channel} sellers`);
      break;
    }
  }

  return { score, reasons };
}

export function classifyGoods(
  description: string,
  industry: string,
  salesChannels: string[],
  topN = 5
): ClassSuggestion[] {
  const normalized = normalize(description + ' ' + industry);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);

  const results: Array<{ nc: NiceClassData; score: number; reasons: string[] }> = [];

  for (const nc of NICE_CLASS_DATA) {
    const { score, reasons } = scoreClass(nc, words, industry, salesChannels);
    if (score > 0) {
      results.push({ nc, score, reasons });
    }
  }

  results.sort((a, b) => b.score - a.score);

  const maxScore = results[0]?.score || 1;

  return results.slice(0, topN).map(r => ({
    classNumber: r.nc.classNumber,
    titleEn: r.nc.titleEn,
    titleZh: r.nc.titleZh,
    category: r.nc.category,
    confidence: Math.min(0.95, r.score / maxScore),
    reasons: r.reasons,
  }));
}

export function getClassByNumber(classNumber: number): NiceClassData | undefined {
  return NICE_CLASS_DATA.find(nc => nc.classNumber === classNumber);
}

export function getAllClasses(): NiceClassData[] {
  return NICE_CLASS_DATA;
}

export function calculatePrice(classCount: number): { pricePerClass: number; total: number } {
  const pricePerClass = 100;
  return { pricePerClass, total: pricePerClass * classCount };
}
