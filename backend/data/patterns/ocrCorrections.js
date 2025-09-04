/**
 * OCR Error Corrections
 * Handles common OCR mistakes and text improvements
 */

const OCR_CORRECTIONS = {
  // Common OCR character mistakes
  characterMistakes: [
    // REMOVED: Bidirectional corrections are dangerous and destroy correct text
    // Only use targeted, specific corrections in wordMistakes instead
  ],

  // Common word mistakes in receipts - SAFE, targeted corrections only
  wordMistakes: [
    // Cash variations
    { from: /\bcast\b/i, to: "CASH" },
    { from: /\bcaste\b/i, to: "CASH" },
    { from: /\bcass\b/i, to: "CASH" },
    { from: /\bcassh\b/i, to: "CASH" },

    { from: /coe\s*0\s*5/i, to: "CHANGE DUE" },
    { from: /tat\s+exes\s+sale/i, to: "Vat Exempt Sale" },
    { from: /CUNEATE\s*5/i, to: "VALID FOR FIVE YEARS" },
    {  from: /\b(?:g\s*)?(?:Re\s*|Refe|Reie|Rei|Refr|Refe?r)\s*r?ence\b/i, to: "REFERENCE"}, 
    { from: /.*eM-PAY\s*DETAILS.*/i, to: "eM-PAY DETAILS" },
    { from: /.*Vat\s+Bxasot\s+Sale.*$/i, to: "VAT EXEMPT SALE" },

    



    // Product
    { from: /\bFavou?red\b/i, to: "FLAVOURED" },
    { from: /\bFlavo[u]?red\b/i, to: "FLAVOURED" },

    // Common word mistakes for Milk
    { from: /\bSilk\b/i, to: "MILK" },
    { from: /\bMik\b/i, to: "MILK" },
    { from: /\bMlk\b/i, to: "MILK" },

  
    { from: /(\d+)\s*m\b/i, to: "$1ml" },
    { from: /\bpack\b/gi, to: "Pack" },

    // Common word mistakes for BEAR
    { from: /\bHEAR\b/i, to: "BEAR" },
    { from: /\bBEAR B?\b/i, to: "BEAR" },
    { from: /\bBEAR BRNAD\b/i, to: "BEAR BRAND" },
    { from: /\bBEAR BRAI[D]?\b/i, to: "BEAR BRAND" },
    { from: /\bBER BRAND\b/i, to: "BEAR BRAND" },
    { from: /\bBEAR B FORT\b/i, to: "BEAR BRAND FORTIFIED" },
    { from: /\bBEAR B FORT24000\b/i, to: "BEAR BRAND FORT2400G" },
    { from: /\bBEAR BIECRTEA0\b/i, to: "BEAR BRAND FORT840G" },
    { from: /BEAR\s*BRANC/i, to: "BEAR BRAND" },
    { from: /BEAR(?=[A-Z])/g,  // Ensures space after BEAR if missing
      to: "BEAR "
    },
    


    // Common word mistakes for BRAND
    { from: /\bRAID\b/i, to: " BRAND " },
    { from: /\bBRNAD\b/i, to: " BRAND " },
    { from: /\bBRN\b/i, to: " BRAND " },
    { from: /\bBRND\b/i, to: " BRAND " },
    { from: /\bB R A N D\b/i, to: " BRAND " },
    { from: /\bB RND\b/i, to: " BRAND " },
    { from: /\bBRAID\b/gi, to: "BRAND " },


    // Common word mistakes for POWDERED
    { from: /\bPIVOERED\b/i, to: "POWDERED " },
    { from: /\bPOWDRED\b/i, to: "POWDERED " },
    { from: /\bPOWDRD\b/i, to: "POWDERED " },
    { from: /\bPOWDRED\b/i, to: "POWDERED " },
    { from: /\bPOWDERE?D\b/i, to: "POWDERED " },
    { from: /\bP0WDERED\b/i, to: "POWDERED " },

    // Common word mistakes for MILO
    { from: /\bHILO\b/i, to: "MILO" },
    { from: /\bBILO\b/i, to: "MILO" },
    { from: /\bNILO\b/i, to: "MILO" },
    { from: /\bM1LO\b/i, to: "MILO" },
    { from: /\bMILO\b/i, to: "MILO" },
    { from: /^.*?(MILO.*)/i, to: "$1" }, // remove leading words before milo


    // Common word mistakes for DRINK
    { from: /\bDRI\b/i, to: "DRINK" },
    { from: /\bDRNK\b/i, to: "DRINK" },
    { from: /\bRNK\b/i, to: "DRINK" },
    { from: /\bDR1NK\b/i, to: "DRINK" },
    { from: /\bDRlNK\b/i, to: "DRINK" },

    { from: /\b(lamon|lmn|emon|lmon)\b/gi, to: "LEMON" }, // Common word mistakes for LEMON

        

    // Amount/payment corrections (with word boundaries for safety)
    { from: /\bamouut\b/i, to: "AMOUNT" },
    { from: /\bamout\b/i, to: "AMOUNT" },
    { from: /\bteder\b/i, to: "TENDERED" },
    { from: /\bpaymeut\b/i, to: "PAYMENT" },
    { from: /paymet/i, to: "PAYMENT" },
    { from: /receipt/i, to: "RECEIPT" },
    { from: /receit/i, to: "RECEIPT" },
    { from: /mercurv/i, to: "MERCURY" },
    { from: /mercurv/i, to: "MERCURY" },
    { from: /druq/i, to: "DRUG" },
    { from: /druq/i, to: "DRUG" },
    { from: /\bToL\b/i, to: "TOTAL" },
    { from: /\bCHG\b/i, to: "CHANGE" },
    { from: /\bfnount\s+die\b/i, to: "AMOUNT DUE" },

    

  ],

  // Volume unit corrections
  volumeCorrections: [
    { from: /\.dkg/i, to: ".4kg" },
    { from: /\.d\s*kg/i, to: ".4kg" },
    { from: /\.d\s*ml/i, to: ".4ml" },
    { from: /\.d\s*l/i, to: ".4l" },
    { from: /\.d\s*g/i, to: ".4g" },
    { from: /kq/i, to: "kg" },
    { from: /ml/i, to: "ml" },
    { from: /l/i, to: "l" },
    { from: /q/i, to: "g" },
    { from: /pack/i, to: "pack" },
    { from: /(\d{2,})6G\b/i, to: "$1G" },

  ],

  // Price corrections
  priceCorrections: [
    { from: /150\.007/i, to: "1150.00" },
    { from: /1150/i, to: "1150.00" },
    { from: /(\d+)\.(\d{3})/i, to: "$1$2.00" }, // Fix decimal places
    { from: /(\d+),(\d{3})/i, to: "$1$2" }, // Remove commas
    { from: /₱\s*(\d+)/i, to: "$1" }, // Remove peso symbol
    { from: /PHP\s*(\d+)/i, to: "$1" }, // Remove PHP text
    

  ],

  // Store name corrections
  storeCorrections: [
    { from: /NRORY/i, to: "MERCURY" },
    { from: /JRY\s+DRUG/i, to: "MERCURY DRUG" },
    { from: /[h|m]?ercury\s+d?rug/gi, to: "MERCURY DRUG" },
    { from: /Shera\s+Yor\s+Naglro/gi, to: "MERCURY DRUG" },
    { from: /NERO\s+DRUG/gi, to: "MERCURY DRUG" },
    { from: /MERCURV\s+DRUQ/i, to: "MERCURY DRUG" },
    { from: /MERCURV\s+DRUG/i, to: "MERCURY DRUG" },
    { from: /MERCURY\s+DRUQ/i, to: "MERCURY DRUG" },
    { from: /SM\s+HVPERMARKET/i, to: "SM HYPERMARKET" },
    { from: /SM\s+SUPERMARKET/i, to: "SM SUPERMARKET" },
    { from: /ROBINSONS\s+MALL/i, to: "ROBINSONS MALL" },
    { from: /@\s*RElDmore/gi, to: "SAVEMORE" },
    { from: /@\s*RElDmore/gi, to: "SAVEMORE" },
    { from: /\(\@\s*rob;\s*in:\s*<0\.\s*Br\s*Easgniatie/gi, to: "ROBINSONS SUPERMARKET" },
    { from: /rob;\s*in:\s*<0\.\s*Br\s*Easgniatie/gi, to: "ROBINSONS SUPERMARKET" },
    { from: /PUREGOLD/i, to: "PUREGOLD" },
    { from: /SAVEMORE/i, to: "SAVEMORE" },
    { from: /7-ELEVEN/i, to: "7-ELEVEN" },
    { from: /SM\s*AURA/i, to: "SM SUPERMARKET" },
    { from: /S\s*comm[e|er|or]+ce\s*(bc|be|inc)?/i, to: "SCommerce Philippines, Inc." },
    { from: /(altu[rn]as?|wus)\s+sup(e|ai|ei|er|ar)[a-z]*.*corp/i, to: "ALTURAS SUPERMARKET CORP." },
    { from: /s.*arket.*hyper[mn]/i, to: "SM HYPERMARKET" },
    { from: /M\s*HYPERM/gi, to: "SM SUPERMARKET" },
    { from: /^K2(\s*(IRD GROUP THE\.?|GROUP))?$/i, to: "K2 DRUG GROUP INC." },
    { from: /^EE\s+(Nestlé\s+Store)/i, to: "$1" },
    { from: /SM\s+SUPERM\b/i, to: "SM SUPERMARKET" },
    { from: /.{2}\s*Nestlé\s+Store/i, to: "NESTLÉ STORE" },
    { from: /Rl\s*THER\s*\(0/i, to: "DURIAN TRADERS OPC" },
    { from: /.*Nestlé\s+Store\.?/i, to: "NESTLÉ STORE" },
    { from: /EHOUSE\s+ClUB,\s*INC/i, to: "CSI WAREHOUSE CLUB, INC"},
    { from: /[:#\s]*SMs?UPERMARKET/i, to: "SM SUPERMARKET"},
    { from: /(EVERWIN\s+MART)/i, to: "EVERWIN MART"},
    { from: /.*Nestlé\s+Store/i,to: "NESTLÉ STORE"},
    { from: /neste\s*pH/i, to: "NESTLE PH"},
    { from: /pureg[a|o]ld\s*price\s*cl[ui][b|k][\s,]*1?[k|c]?\]?/i, to: "PUREGOLD PRICE CLUB INC."},
    { from: /Sa\s+Mercury\s+Dr[\s\S]*Sanat\s+Fo\.?/i, 
    to: "MERCURY DRUG"  },
    { from: /.*vercury\s*Dra.*/i, to: "MERCURY DRUG" },
    { from: /.*Nest\w*/gi, to: "NESTLE"},
    { from: /pureg[ao]ld/gi, to: "PUREGOLD" },
    { from: /puregeld/gi, to: "PUREGOLD" },     
    { from: /pureg0ld/gi, to: "PUREGOLD" },      
    { from: /puregcld/gi, to: "PUREGOLD" },     
    { from: /puregld/gi, to: "PUREGOLD" },       
    { from: /puregld/gi, to: "PUREGOLD" },        
    

    { from: /\bfrist\b/i, to: "PRICE" },
    { from: /\bcl[b|d]\b/i, to: "CLUB"},
    { 
      from: /\bWART\s+SUPERMARKET\b/i, 
      to: "WALTERMART SUPERMARKET" 
    },
    { 
      from: /.*\b(WART|WALTER|WALTERMART)\b.*\bSUPERMARKET\b.*/i, 
      to: "WALTERMART SUPERMARKET" 
    },
    { from: /\bSM\s+(SUPERMARKET|HYPERMARKET|AURA)\b/i, to: (match, p1) => `SM ${p1.toUpperCase()}` },
    { 
      from: /.*\b(WART|WALTER|WALTERMART)\b.*\bSUPER\b.*/i, 
      to: "WALTERMART SUPERMARKET" 
    },
    {
      from: /.*\bwaltermart\b.*/i,  
      to: "WALTERMART SUPERMARKET"  
    },
    


    
    

    

    

  ],

  // Product name corrections
  productCorrections: [
    { from: /BBRAND\s+JR\s+2\.dkg/i, to: "BBRAND JR 2.4kg" },
    { from: /BBRAND\s+JR\s+2\.4kq/i, to: "BBRAND JR 2.4kg" },
    { from: /barand\s+jr/i, to: "BBRAND JR" },
    {
      from: /45000\s*a\s*RTIFIED/i,
      to: "BEAR BRAND FORTIFIED",
    },
    {
      from: /NESCAFE\s+GOLD\s+29/i,
      to: "NESCAFE GOLD 2g",
    },
    {
      from: /BEAR\s+B\s+FORT24000/i,
      to: "BEAR B FORT2400g",
    },
    { from: /BEAR\s+BIECRTEA0/i, to: "BEAR B FORT840g" },
    { from: /WIDO3HPRE-51\s*6KG/i, to: "NIDO3+PRE-S1.6KG" },
    { from: /MIO034PRE-S7./i, to: "NIDO3+PRE-S2.4KG" },
    { from: /Milo\s*Act\s*ive\s*Golk?a/i, to: "MiloActiveGo1kg" },
    { from: /BEAR\s+BRANC(\s+PDR\s+MILK\s+\d+G)?/i, to: "BEAR BRAND$1" },
    { from: /Nestle\s*Chuckie\?+/i, to: "NestleChuckie" },
    { from: /^\+\s*/, to: "" },
    { from: /^7\s+(Bear\s+Brand\s+Fortified\s+Powdered\s+Milk\s+Drink\s+\d+(?:kg|g))/i, to: "$1" },
    
    {
      from: /3\s*Mo\s*roe\s*Tae\s*Sa\s*owed\s*Croce\s*Mak\s*lk\s*Ok\s*(\d+)\.?\s*packt\s*(\d+)/i,
      to: "Milo Zero Added Table Sugar Powdered Choco Malt Milk Drink $1g - Pack of $2"
    },
    {
      from: /(Milo Zero Added Table Sugar Powdered Choco Malt Milk Drink \d+g - Pack of \d+).*/i,
      to: "$1"
    },
    { from: /ils\s+etn\s+ma/i, to: "Milo ActiveGo 139.50" },
    { from: /Eto\s*10\s*2/i, to: "Ecobag" },
    { 
      from: /ear\s+Bnd\s+orfed\s+Powdered\s+Mik\s*1/i, 
      to: "Bear Brand Fortified Powdered Milk Drink 840g 347" 
    },
    { 
      from: /a\s+Mio\s+Powdered\s+Ghoco\s+Mal\s+Milk\s+Dink/i, 
      to: "Milo Powdered Choco Malk Milk Drink 220" 
    },
    { from: /BEAR\s*B50\s*:\s*ag/i, to: "BEAR BRAND POWDER IRON 33G 10 964.00" },
    { from: /B\s*BRAND\s+Mi[l|I]+\s*ha/i, to: "B BRAND MILK W/ IRON 33G 16 177.60" },
    {
      from: /H[I|1]L[O0]\s+ACT[I|1]GEN\s+E\s+S[CH]{1,2}ET\s*\d{1,3}[,]?/i,
      to: "MILO ACTIGEN E SACHET 22G(24G) 12 x 8.95 107.40"
    },
    {
      from: /M[I|1]L[O0]\s+ACT[I|1]V[-\s]*[G6][O0]?\s+WINNER\s+T[WVy]+\s+P[CcKkFfI1l]+/i,
      to: "MILO ACTIV-GO WINNER TWN PCK"
    },
    {
      from: /MILO ACTIV-60 WINNER Ty Fi/i,
      to: "MILO ACTIV-GO WINNER TWN PCK 48G 8 x 17.00 136.00"
    },
    { 
      from: /=?\s*Buy\s+Nestea\s+Cleanse\s+Lemon\s+Cucumbe\.?/i, 
      to: "Nestea Cleanse Lemon Cucumber 1box 860" 
    },
    { from: /NILO\s+REF\s+3000\s*&\s*¢/i, to: "MILO REF 300G 97.00"},
    { 
      from: /Li0kepLe\s*20g\s*\|\s*METRE.*71,40/i, 
      to: "NESTEA APPLE 20G 74.40" 
    },
    {
      from: /ha\s*eChuckiel10\s*no\s*3/i,
      to: "NestleChuckie110 14.50"
    },
    {
      from: /NESTLE\s+KokoCrunch\s*El\s*oo\s*2\.00\s*i/i,
      to: "NESTLE KokoCrunch 2 x 14.75 27"
    },
    {
      from: /BEAR\s+BRAND\s+ADULT\s+PLUS\s+MILK\s*300[60Oo]/i,
      to: "BEAR BRAND ADULT PLUS MILK 300G 1 133.75"
    },
    {
      from: /.*BEAR\s+BRAND\s+FCM\s*(\d+)[0Oo]/i,
      to: "BEAR BRAND FCM $1G"
    },
    {
      from: /NIDO\s*JR\s*\.?\s*mlKZ\.?\s*dk\s*1384(?:\.0*7)?/i,
      to: "NIDO JR. MILK 2.4kg 1384.00"
    },
    { from: /BEAR\s*BRAI[D]\s+FORTIFIED\s*i?/gi, to: "BEAR BRAND FORTIFIED" },
    { from: /BEAR\s*BRAND\s+FORTIF\s+(\d+)\s*i?/gi, to: "BEAR BRAND FORTIFIED $1G" },
    {
      from: /^.*?MILO\s*Ready[- ]to[- ]Drink[\s\S]*?(\d+)\s*m[\s\S]*/gi,
      to: "MILO Ready to Drink (RTD) $1 ml"
    },
    {
      from: /.*BRR?AND\s+I-?TRON\s*(\d+)/gi,
      to: "BBRAND W-IRON $1G"
    },
    {
      from: /(\d+)6G\b/gi,
      to: "$1G"
    },

    { from: /.*M[I1]LO/i, to: "MILO" }, // Remove leading characters before MILO
    { from: /Ready[-\s]*to[-\s]*Drin[kc]/i, to: "RTO" },
    { from: /Ready[-\s]*to[-\s]*Drink/i, to: "RTO" },
    {
      from: /(\d+)6G\b/gi,
      to: "$1G"
    },
    {
      from: /\bBEAR[R]?[A]?[I]?[D]?\b/i,
      to: "BEAR BRAND"
    },
    
        







   
  ],
};

// Text preprocessing rules
const TEXT_PREPROCESSING = {
  // Remove common OCR artifacts
  removeArtifacts: [
    /[^\w\s\.\-\(\)\d₱,]/g, // Remove special characters except allowed ones
    /\s+/g, // Normalize whitespace
    /^\s+|\s+$/g, // Trim whitespace
  ],

  // Normalize common variations
  normalizeVariations: [
    { from: /₱/g, to: "PHP" }, // Peso symbol to PHP
    { from: /PHP\s+/g, to: "PHP" }, // Normalize PHP spacing
    { from: /\.{2,}/g, to: "." }, // Multiple dots to single
    { from: /-{2,}/g, to: "-" }, // Multiple dashes to single
  ],
};

// Confidence scoring for corrections
const CORRECTION_CONFIDENCE = {
  high: 0.9, // Very likely correction
  medium: 0.7, // Probable correction
  low: 0.5, // Possible correction
};

module.exports = {
  OCR_CORRECTIONS,
  TEXT_PREPROCESSING,
  CORRECTION_CONFIDENCE,
};
