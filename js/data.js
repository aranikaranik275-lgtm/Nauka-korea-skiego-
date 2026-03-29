'use strict';

const HANGUL_DATA = {
  consonants: [
    {
      char: 'ㄱ',
      name: '기역',
      romanization: 'g/k',
      description: 'Spółgłoska podobna do litery G lub K',
      strokes: [
        { points: [[15,25],[85,25]] },
        { points: [[85,25],[85,80]] }
      ]
    },
    {
      char: 'ㄴ',
      name: '니은',
      romanization: 'n',
      description: 'Spółgłoska N - kształt litery L',
      strokes: [
        { points: [[20,20],[20,80]] },
        { points: [[20,80],[80,80]] }
      ]
    },
    {
      char: 'ㄷ',
      name: '디귿',
      romanization: 'd/t',
      description: 'Spółgłoska D lub T - kształt litery C',
      strokes: [
        { points: [[15,20],[85,20]] },
        { points: [[15,20],[15,80]] },
        { points: [[15,80],[85,80]] }
      ]
    },
    {
      char: 'ㄹ',
      name: '리을',
      romanization: 'r/l',
      description: 'Spółgłoska R lub L - zygzak',
      strokes: [
        { points: [[15,20],[80,20]] },
        { points: [[80,20],[80,50]] },
        { points: [[80,50],[15,50]] },
        { points: [[15,50],[15,80]] },
        { points: [[15,80],[80,80]] }
      ]
    },
    {
      char: 'ㅁ',
      name: '미음',
      romanization: 'm',
      description: 'Spółgłoska M - kwadrat',
      strokes: [
        { points: [[20,20],[20,80]] },
        { points: [[20,20],[80,20]] },
        { points: [[80,20],[80,80]] },
        { points: [[20,80],[80,80]] }
      ]
    },
    {
      char: 'ㅂ',
      name: '비읍',
      romanization: 'b/p',
      description: 'Spółgłoska B lub P',
      strokes: [
        { points: [[25,20],[25,80]] },
        { points: [[75,20],[75,80]] },
        { points: [[25,20],[75,20]] },
        { points: [[25,52],[75,52]] },
        { points: [[25,80],[75,80]] }
      ]
    },
    {
      char: 'ㅅ',
      name: '시옷',
      romanization: 's',
      description: 'Spółgłoska S - litera V',
      strokes: [
        { points: [[50,15],[20,80]] },
        { points: [[50,15],[80,80]] }
      ]
    },
    {
      char: 'ㅇ',
      name: '이응',
      romanization: 'ng/∅',
      description: 'Jako inicjała cicha, na końcu sylaby "ng"',
      strokes: [
        {
          points: Array.from({length: 25}, (_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            return [50 + 32 * Math.cos(angle), 50 + 32 * Math.sin(angle)];
          })
        }
      ]
    },
    {
      char: 'ㅈ',
      name: '지읒',
      romanization: 'j',
      description: 'Spółgłoska J',
      strokes: [
        { points: [[15,30],[85,30]] },
        { points: [[50,30],[22,80]] },
        { points: [[50,30],[78,80]] }
      ]
    },
    {
      char: 'ㅊ',
      name: '치읓',
      romanization: 'ch',
      description: 'Spółgłoska CH - aspirowane',
      strokes: [
        { points: [[38,12],[62,12]] },
        { points: [[50,12],[50,28]] },
        { points: [[15,35],[85,35]] },
        { points: [[50,35],[22,80]] },
        { points: [[50,35],[78,80]] }
      ]
    },
    {
      char: 'ㅋ',
      name: '키읔',
      romanization: 'k',
      description: 'Spółgłoska K - aspirowane',
      strokes: [
        { points: [[15,20],[85,20]] },
        { points: [[15,52],[70,52]] },
        { points: [[85,20],[85,80]] }
      ]
    },
    {
      char: 'ㅌ',
      name: '티읕',
      romanization: 't',
      description: 'Spółgłoska T - aspirowane',
      strokes: [
        { points: [[15,20],[85,20]] },
        { points: [[15,20],[15,80]] },
        { points: [[15,52],[85,52]] },
        { points: [[15,80],[85,80]] }
      ]
    },
    {
      char: 'ㅍ',
      name: '피읖',
      romanization: 'p',
      description: 'Spółgłoska P - aspirowane',
      strokes: [
        { points: [[15,35],[85,35]] },
        { points: [[30,35],[30,80]] },
        { points: [[70,35],[70,80]] },
        { points: [[30,65],[70,65]] }
      ]
    },
    {
      char: 'ㅎ',
      name: '히읗',
      romanization: 'h',
      description: 'Spółgłoska H',
      strokes: [
        { points: [[35,12],[65,12]] },
        { points: [[50,12],[50,30]] },
        {
          points: Array.from({length: 25}, (_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            return [50 + 26 * Math.cos(angle), 62 + 26 * Math.sin(angle)];
          })
        }
      ]
    }
  ],

  doubleConsonants: [
    {
      char: 'ㄲ',
      name: '쌍기역',
      romanization: 'kk',
      description: 'Napięte K (된소리) — wymawiane z napięciem gardła, bez wydechu powietrza. Różni się od ㄱ (słabe) i ㅋ (z wydechem).',
      strokes: [
        { points: [[11,25],[39,25]] },
        { points: [[39,25],[39,80]] },
        { points: [[61,25],[89,25]] },
        { points: [[89,25],[89,80]] }
      ]
    },
    {
      char: 'ㄸ',
      name: '쌍디귿',
      romanization: 'tt',
      description: 'Napięte T (된소리) — wymawiane z napięciem, bez wydechu. Różni się od ㄷ (słabe) i ㅌ (z wydechem).',
      strokes: [
        { points: [[11,20],[39,20]] },
        { points: [[11,20],[11,80]] },
        { points: [[11,80],[39,80]] },
        { points: [[61,20],[89,20]] },
        { points: [[61,20],[61,80]] },
        { points: [[61,80],[89,80]] }
      ]
    },
    {
      char: 'ㅃ',
      name: '쌍비읍',
      romanization: 'pp',
      description: 'Napięte P (된소리) — wymawiane z napięciem warg, bez wydechu. Różni się od ㅂ (słabe) i ㅍ (z wydechem).',
      strokes: [
        { points: [[15,20],[15,80]] },
        { points: [[35,20],[35,80]] },
        { points: [[15,20],[35,20]] },
        { points: [[15,52],[35,52]] },
        { points: [[15,80],[35,80]] },
        { points: [[65,20],[65,80]] },
        { points: [[85,20],[85,80]] },
        { points: [[65,20],[85,20]] },
        { points: [[65,52],[85,52]] },
        { points: [[65,80],[85,80]] }
      ]
    },
    {
      char: 'ㅆ',
      name: '쌍시옷',
      romanization: 'ss',
      description: 'Napięte S (된소리) — mocniejsze, bardziej naprężone niż ㅅ. Często słyszane w słowie 있어요 (iseoyo).',
      strokes: [
        { points: [[25,15],[13,80]] },
        { points: [[25,15],[37,80]] },
        { points: [[75,15],[63,80]] },
        { points: [[75,15],[87,80]] }
      ]
    },
    {
      char: 'ㅉ',
      name: '쌍지읒',
      romanization: 'jj',
      description: 'Napięte DŻ (된소리) — wymawiane z napięciem, bez wydechu. Różni się od ㅈ (słabe) i ㅊ (z wydechem).',
      strokes: [
        { points: [[11,30],[39,30]] },
        { points: [[25,30],[14,80]] },
        { points: [[25,30],[36,80]] },
        { points: [[61,30],[89,30]] },
        { points: [[75,30],[64,80]] },
        { points: [[75,30],[86,80]] }
      ]
    }
  ],

  vowels: [
    {
      char: 'ㅏ',
      name: '아',
      romanization: 'a',
      description: 'Samogłoska A - pionowa kreska z prawą gałązką',
      strokes: [
        { points: [[50,15],[50,85]] },
        { points: [[50,45],[80,45]] }
      ]
    },
    {
      char: 'ㅑ',
      name: '야',
      romanization: 'ya',
      description: 'Samogłoska YA',
      strokes: [
        { points: [[50,15],[50,85]] },
        { points: [[50,33],[80,33]] },
        { points: [[50,57],[80,57]] }
      ]
    },
    {
      char: 'ㅓ',
      name: '어',
      romanization: 'eo',
      description: 'Samogłoska EO - pionowa kreska z lewą gałązką',
      strokes: [
        { points: [[50,15],[50,85]] },
        { points: [[50,45],[20,45]] }
      ]
    },
    {
      char: 'ㅕ',
      name: '여',
      romanization: 'yeo',
      description: 'Samogłoska YEO',
      strokes: [
        { points: [[50,15],[50,85]] },
        { points: [[50,33],[20,33]] },
        { points: [[50,57],[20,57]] }
      ]
    },
    {
      char: 'ㅗ',
      name: '오',
      romanization: 'o',
      description: 'Samogłoska O - pozioma kreska z górną gałązką',
      strokes: [
        { points: [[15,62],[85,62]] },
        { points: [[50,62],[50,20]] }
      ]
    },
    {
      char: 'ㅛ',
      name: '요',
      romanization: 'yo',
      description: 'Samogłoska YO',
      strokes: [
        { points: [[15,65],[85,65]] },
        { points: [[35,65],[35,25]] },
        { points: [[65,65],[65,25]] }
      ]
    },
    {
      char: 'ㅜ',
      name: '우',
      romanization: 'u',
      description: 'Samogłoska U - pozioma kreska z dolną gałązką',
      strokes: [
        { points: [[15,38],[85,38]] },
        { points: [[50,38],[50,80]] }
      ]
    },
    {
      char: 'ㅠ',
      name: '유',
      romanization: 'yu',
      description: 'Samogłoska YU',
      strokes: [
        { points: [[15,35],[85,35]] },
        { points: [[35,35],[35,75]] },
        { points: [[65,35],[65,75]] }
      ]
    },
    {
      char: 'ㅡ',
      name: '으',
      romanization: 'eu',
      description: 'Samogłoska EU - pozioma kreska',
      strokes: [
        { points: [[15,50],[85,50]] }
      ]
    },
    {
      char: 'ㅣ',
      name: '이',
      romanization: 'i',
      description: 'Samogłoska I - pionowa kreska',
      strokes: [
        { points: [[50,15],[50,85]] }
      ]
    }
  ]
};

const VOCABULARY = [
  // Pozdrowienia
  { korean: '안녕하세요', romanization: 'annyeonghaseyo', polish: 'Dzień dobry / Cześć (grzecznie)', category: 'Pozdrowienia' },
  { korean: '안녕', romanization: 'annyeong', polish: 'Cześć (nieformalnie)', category: 'Pozdrowienia' },
  { korean: '감사합니다', romanization: 'gamsahamnida', polish: 'Dziękuję (formalnie)', category: 'Pozdrowienia' },
  { korean: '고마워', romanization: 'gomawo', polish: 'Dzięki (nieformalnie)', category: 'Pozdrowienia' },
  { korean: '죄송합니다', romanization: 'joesonghamnida', polish: 'Przepraszam (formalnie)', category: 'Pozdrowienia' },
  { korean: '미안해', romanization: 'mianhae', polish: 'Przepraszam (nieformalnie)', category: 'Pozdrowienia' },
  { korean: '네', romanization: 'ne', polish: 'Tak', category: 'Pozdrowienia' },
  { korean: '아니요', romanization: 'aniyo', polish: 'Nie', category: 'Pozdrowienia' },
  { korean: '안녕히 가세요', romanization: 'annyeonghi gaseyo', polish: 'Do widzenia (do odchodzącego)', category: 'Pozdrowienia' },
  { korean: '반갑습니다', romanization: 'bangapseumnida', polish: 'Miło mi cię poznać', category: 'Pozdrowienia' },

  // Liczby
  { korean: '일', romanization: 'il', polish: 'Jeden (liczby sino-koreańskie)', category: 'Liczby' },
  { korean: '이', romanization: 'i', polish: 'Dwa (sino-koreańskie)', category: 'Liczby' },
  { korean: '삼', romanization: 'sam', polish: 'Trzy (sino-koreańskie)', category: 'Liczby' },
  { korean: '사', romanization: 'sa', polish: 'Cztery (sino-koreańskie)', category: 'Liczby' },
  { korean: '오', romanization: 'o', polish: 'Pięć (sino-koreańskie)', category: 'Liczby' },
  { korean: '하나', romanization: 'hana', polish: 'Jeden (liczby koreańskie)', category: 'Liczby' },
  { korean: '둘', romanization: 'dul', polish: 'Dwa (koreańskie)', category: 'Liczby' },
  { korean: '셋', romanization: 'set', polish: 'Trzy (koreańskie)', category: 'Liczby' },
  { korean: '넷', romanization: 'net', polish: 'Cztery (koreańskie)', category: 'Liczby' },
  { korean: '다섯', romanization: 'daseot', polish: 'Pięć (koreańskie)', category: 'Liczby' },

  // Rodzina
  { korean: '어머니', romanization: 'eomeoni', polish: 'Mama', category: 'Rodzina' },
  { korean: '아버지', romanization: 'abeoji', polish: 'Tata', category: 'Rodzina' },
  { korean: '오빠', romanization: 'oppa', polish: 'Starszy brat (dla kobiety)', category: 'Rodzina' },
  { korean: '언니', romanization: 'eonni', polish: 'Starsza siostra (dla kobiety)', category: 'Rodzina' },
  { korean: '형', romanization: 'hyeong', polish: 'Starszy brat (dla mężczyzny)', category: 'Rodzina' },
  { korean: '친구', romanization: 'chingu', polish: 'Przyjaciel / przyjaciółka', category: 'Rodzina' },
  { korean: '남자친구', romanization: 'namjachingu', polish: 'Chłopak', category: 'Rodzina' },
  { korean: '여자친구', romanization: 'yeojachingu', polish: 'Dziewczyna', category: 'Rodzina' },

  // Jedzenie
  { korean: '밥', romanization: 'bap', polish: 'Ryż / posiłek', category: 'Jedzenie' },
  { korean: '물', romanization: 'mul', polish: 'Woda', category: 'Jedzenie' },
  { korean: '김치', romanization: 'kimchi', polish: 'Kimchi (koreańska kapusta)', category: 'Jedzenie' },
  { korean: '커피', romanization: 'keopi', polish: 'Kawa', category: 'Jedzenie' },
  { korean: '차', romanization: 'cha', polish: 'Herbata', category: 'Jedzenie' },
  { korean: '빵', romanization: 'ppang', polish: 'Chleb', category: 'Jedzenie' },
  { korean: '고기', romanization: 'gogi', polish: 'Mięso', category: 'Jedzenie' },
  { korean: '라면', romanization: 'ramyeon', polish: 'Zupa ramyeon (koreański ramen)', category: 'Jedzenie' },

  // Kolory
  { korean: '빨간색', romanization: 'ppalganssaek', polish: 'Czerwony', category: 'Kolory' },
  { korean: '파란색', romanization: 'paranssaek', polish: 'Niebieski', category: 'Kolory' },
  { korean: '노란색', romanization: 'nolanssaek', polish: 'Żółty', category: 'Kolory' },
  { korean: '초록색', romanization: 'choroksaek', polish: 'Zielony', category: 'Kolory' },
  { korean: '하얀색', romanization: 'hayanssaek', polish: 'Biały', category: 'Kolory' },
  { korean: '검은색', romanization: 'geomeunsaek', polish: 'Czarny', category: 'Kolory' },
  { korean: '분홍색', romanization: 'bunhongsaek', polish: 'Różowy', category: 'Kolory' },

  // Zwierzęta
  { korean: '강아지', romanization: 'gangaji', polish: 'Szczeniak / pies', category: 'Zwierzęta' },
  { korean: '고양이', romanization: 'goyangi', polish: 'Kot', category: 'Zwierzęta' },
  { korean: '새', romanization: 'sae', polish: 'Ptak', category: 'Zwierzęta' },
  { korean: '물고기', romanization: 'mulgogi', polish: 'Ryba', category: 'Zwierzęta' },
  { korean: '토끼', romanization: 'tokki', polish: 'Królik', category: 'Zwierzęta' },

  // Miejsca
  { korean: '학교', romanization: 'hakgyo', polish: 'Szkoła', category: 'Miejsca' },
  { korean: '집', romanization: 'jip', polish: 'Dom', category: 'Miejsca' },
  { korean: '서울', romanization: 'Seoul', polish: 'Seul (stolica Korei)', category: 'Miejsca' },
  { korean: '병원', romanization: 'byeongwon', polish: 'Szpital', category: 'Miejsca' },
  { korean: '식당', romanization: 'sikdang', polish: 'Restauracja', category: 'Miejsca' },
  { korean: '카페', romanization: 'kape', polish: 'Kawiarnia', category: 'Miejsca' },

  // Codzienne
  { korean: '사랑', romanization: 'sarang', polish: 'Miłość', category: 'Codzienne' },
  { korean: '한국', romanization: 'hanguk', polish: 'Korea', category: 'Codzienne' },
  { korean: '이름', romanization: 'ireum', polish: 'Imię / nazwa', category: 'Codzienne' },
  { korean: '오늘', romanization: 'oneul', polish: 'Dzisiaj', category: 'Codzienne' },
  { korean: '내일', romanization: 'naeil', polish: 'Jutro', category: 'Codzienne' },
  { korean: '어제', romanization: 'eoje', polish: 'Wczoraj', category: 'Codzienne' },
  { korean: '시간', romanization: 'sigan', polish: 'Czas / godzina', category: 'Codzienne' },
  { korean: '음악', romanization: 'eumsak', polish: 'Muzyka', category: 'Codzienne' },
  { korean: '영화', romanization: 'yeonghwa', polish: 'Film', category: 'Codzienne' },
  { korean: '책', romanization: 'chaek', polish: 'Książka', category: 'Codzienne' },
  { korean: '공부', romanization: 'gongbu', polish: 'Nauka / studiowanie', category: 'Codzienne' },
  { korean: '한국어', romanization: 'hangugeo', polish: 'Język koreański', category: 'Codzienne' }
];

const CATEGORIES = ['Wszystkie', 'Pozdrowienia', 'Liczby', 'Rodzina', 'Jedzenie', 'Kolory', 'Zwierzęta', 'Miejsca', 'Codzienne'];
