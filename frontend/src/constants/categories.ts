import { ImageStyle, ViewStyle, TextStyle } from 'react-native';export interface Category {
  id: string;
  slug: string;
  name: string;
  image: any;
  bg: any;
  subcategories: string[];
  imageStyle?: ImageStyle;
  textContainerStyle?: ViewStyle; // ОСЫ ЖОЛДЫ ҚОС
  titleStyle?: TextStyle;         // ОСЫ ЖОЛДЫ ҚОС
}

export const PRODUCT_CATEGORIES: Category[] = [
  {
    id: 'c1',
    slug: 'azyk-tulik',
    name: 'Азық-түлік',
    image: require('../assets/azyk.png'),
    bg: require('../assets/rec-azyk.png'), // Жаңа фон
    subcategories: ['Көкөністер мен жемістер', 'Ет және шұжық', 'Балық', 'Жұмыртқа', 'Майлар'],
    imageStyle: {
      width: 220,    // Нақты ені
      height: 140,   // Нақты биіктігі
      bottom: -3,   // Картаның төменгі шетінен -15px шығып тұр
      right: 5,    // Оң жақ граньнан -10px шығып тұр (кесілген жерін дәл келтіру)
    },
    textContainerStyle: {
    paddingLeft: 5, // Оңға жылжыту үшін
  },
  titleStyle: {
    lineHeight: 30, // 80% эффектісі
  }
  },
  {
    id: 'c2',
    slug: 'sut-onimderi',
    name: 'Сүт өнімдері',
    image: require('../assets/sut.png'),
    bg: require('../assets/rec-sut.png'), // Жаңа фон
    subcategories: ['Сүт және қаймақ', 'Ірімшік', 'Сүзбе', 'Йогурттар', 'Сары май'],
    imageStyle: {
      width: 180,    // Нақты ені
      height: 140,   // Нақты биіктігі
      bottom: -2,   // Картаның төменгі шетінен -15px шығып тұр
      left: 5,    // Оң жақ граньнан -10px шығып тұр (кесілген жерін дәл келтіру)
    },
    textContainerStyle: {
    paddingLeft: 30, // Оңға жылжыту үшін
  },
  titleStyle: {
    lineHeight: 30, // 80% эффектісі
  }
  },
  {
    id: 'c3',
    slug: 'susyndtar',
    name: 'Сусындар',
    image: require('../assets/susyn.png'),
    bg: require('../assets/rec-sus.png'), // Жаңа фон
    subcategories: ['Газдалған сулар', 'Шырындар', 'Ауыз су', 'Шай және кофе'],
    imageStyle: {
      width: 190,    // Нақты ені
      height: 140,   // Нақты биіктігі
      bottom: -3,   // Картаның төменгі шетінен -15px шығып тұр
      right: -10,    // Оң жақ граньнан -10px шығып тұр (кесілген жерін дәл келтіру)
      borderBottomRightRadius: 24, // Ректангл бұрышымен бірдей радиус

    },
    textContainerStyle: {
    paddingLeft: 30, // Оңға жылжыту үшін
  },
  titleStyle: {
    lineHeight: 30, // 80% эффектісі
  }
  },
  {
    id: 'c4',
    slug: 'tattiler',
    name: 'Тәттілер',
    image: require('../assets/tatt.png'),
    bg: require('../assets/rec-tat.png'), // Жаңа фон
    subcategories: ['Шоколадтар', 'Печеньелер', 'Кәмпиттер', 'Балмұздақ'],
    imageStyle: {
      width: 245,    // Нақты ені
      height: 145,   // Нақты биіктігі
      bottom: -3,   // Картаның төменгі шетінен -15px шығып тұр
      left: 10,    // Оң жақ граньнан -10px шығып тұр (кесілген жерін дәл келтіру)
    },
    textContainerStyle: {
    paddingLeft: 30, // Оңға жылжыту үшін
  },
  titleStyle: {
    lineHeight: 30, // 80% эффектісі
  }
  },
 {
  id: 'c5',
  slug: 'nan-onimderi',
  name: 'Нан өнімдері',
  image: require('../assets/nan.png'),
  bg: require('../assets/rec-nan.png'),
  subcategories: ['Ақ нан', 'Тоқаштар', 'Лаваш', 'Кептірілген нан'],
  imageStyle: {
    width: 230,    // Фигмадағы нақты ені
    height: 150,   // Карточка биіктігімен бірдей қылсаң, дәл келеді
    bottom: -3,     // Төменгі шетке тақау
    right: -6,      // Оң жаққа тақау
    borderBottomRightRadius: 24, // Ректангл бұрышымен бірдей радиус
  },
  textContainerStyle: {
    paddingLeft: 5, // Оңға жылжыту үшін
  },
  titleStyle: {
    lineHeight: 30, // 80% эффектісі
  }
},
  {
    id: 'c6',
    slug: 'turmystyk-himia',
    name: 'Тұрмыстық химия',
    image: require('../assets/turmistik-himia.png'),
    bg: require('../assets/rec-himia.png'), // Жаңа фон
    subcategories: ['Кір жуғыш ұнтақтар', 'Ыдыс жууға арналған', 'Тазалағыш құралдар'],
    imageStyle: {
      width: 245,    // Нақты ені
      height: 150,   // Нақты биіктігі
      bottom: -3,   // Картаның төменгі шетінен -15px шығып тұр
      left: 0,    // Оң жақ граньнан -10px шығып тұр (кесілген жерін дәл келтіру)
    },
    textContainerStyle: {
    paddingLeft: 50, // Оңға жылжыту үшін
  },
  titleStyle: {
    lineHeight: 20, // 80% эффектісі
  }
  },
  {
    id: 'c7',
    slug: 'gigena',
    name: 'Гигиена',
    image: require('../assets/gigena.png'),
    bg: require('../assets/rec-gig.png'), // Жаңа фон
    subcategories: ['Шампунь және сабын', 'Тіс пастасы', 'Қағаз өнімдері', 'Дене күтімі'],
    imageStyle: {
      width: 225,    // Нақты ені
      height: 150,   // Нақты биіктігі
      bottom: -3,   // Картаның төменгі шетінен -15px шығып тұр
      right: -5,    // Оң жақ граньнан -10px шығып тұр (кесілген жерін дәл келтіру)
    },
    textContainerStyle: {
    paddingLeft: 15, // Оңға жылжыту үшін
  },
  titleStyle: {
    lineHeight: 20, // 80% эффектісі
  }
  },
  {
    id: 'c8',
    slug: 'ui-zhanuar',
    name: 'Үй\nжануарларына',
    image: require('../assets/ui-zhanuarlarina.png'),
    bg: require('../assets/rec-zhanuar.png'), // Жаңа фон
    subcategories: ['Иттерге арналған азық', 'Мысықтарға арналған', 'Күтім құралдары'],
    imageStyle: {
      width: 150,    // Нақты ені
      height: 160,   // Нақты биіктігі
      bottom: -3,   // Картаның төменгі шетінен -15px шығып тұр
      left:10,    // Оң жақ граньнан -10px шығып тұр (кесілген жерін дәл келтіру)
          borderBottomLeftRadius: 20, // Ректангл бұрышымен бірдей радиус

    },
    textContainerStyle: {
    paddingLeft: 20, // Оңға жылжыту үшін
  },
  titleStyle: {     // ШРИФТТІ 20-ҒА ТҮСІРДІК
    lineHeight: 27, // 80% эффектісі
  }
  }
];