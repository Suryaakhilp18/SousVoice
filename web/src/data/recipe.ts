import type { Recipe } from '../types';

export const RECIPE_DATA: Recipe = {
  name: 'Weeknight Buttermilk Pancakes',
  cuisine: 'American Breakfast',
  servings: 2,
  prepTime: '10 min',
  cookTime: '15 min',
  totalTime: '25 min',
  ingredients: [
    '1 cup all-purpose flour',
    '1 tablespoon granulated sugar',
    '1 teaspoon baking powder',
    '1/2 teaspoon baking soda',
    '1 pinch fine salt',
    '1 cup buttermilk',
    '1 large egg',
    '2 tablespoons melted butter'
  ],
  steps: [
    'Whisk 1 cup flour, 1 tablespoon sugar, 1 teaspoon baking powder, half a teaspoon baking soda, and a pinch of salt in a bowl.',
    'In a separate bowl, whisk 1 cup buttermilk, 1 egg, and 2 tablespoons melted butter.',
    'Pour the wet ingredients into the dry ingredients and stir until just combined. A few lumps are fine.',
    'Heat a griddle or non-stick pan over medium heat and lightly grease it.',
    'Pour a quarter cup of batter per pancake. Cook until bubbles form on the surface, about two to three minutes.',
    'Flip and cook the other side until golden, about one to two minutes more.',
  ],
  substitutions: {
    buttermilk:
      '1 cup milk mixed with 1 tablespoon lemon juice or white vinegar, rested for 5 minutes.',
    butter: 'an equal amount of neutral oil (vegetable or canola), or margarine at a 1:1 ratio.',
    egg: '3 tablespoons of aquafaba (chickpea brine), whisked until frothy, or half a mashed ripe banana.',
    'baking powder': '1/4 tsp baking soda plus 1/2 tsp cream of tartar per teaspoon needed.',
    flour: '1:1 cup measure for measure gluten-free baking flour blend.'
  },
  quantities: {
    egg: '1 large egg',
    flour: '1 cup',
    buttermilk: '1 cup',
    butter: '2 tablespoons, melted',
    sugar: '1 tablespoon',
    salt: 'a pinch',
    'baking powder': '1 teaspoon',
    'baking soda': 'half a teaspoon'
  },
};

export const POPULAR_RECIPES: Record<string, Recipe> = {
  biryani: {
    name: 'Hyderabadi Chicken Dum Biryani',
    cuisine: 'Royal Indian Mughlai',
    servings: 4,
    prepTime: '30 min',
    cookTime: '45 min',
    totalTime: '1 hr 15 min',
    ingredients: [
      '500g chicken (or paneer cubes for vegetarian)',
      '2 cups aged Basmati rice (soaked for 30 mins)',
      '1 cup plain yogurt / curd',
      '2 tbsp ginger-garlic paste',
      '1 tsp red chili powder & 1/2 tsp turmeric',
      '1 tsp garam masala & 2 tsp biryani masala',
      '1 cup deep fried golden onions (birista)',
      '1/2 cup fresh mint & coriander leaves',
      '4 tbsp ghee & saffron soaked in warm milk',
      'Whole spices: 2 bay leaves, 4 green cardamoms, 1 black cardamom, 4 cloves, 1 cinnamon stick'
    ],
    steps: [
      'Marinate chicken with yogurt, ginger-garlic paste, red chili powder, turmeric, biryani masala, half of the fried onions, mint, coriander, and 1 tbsp ghee for at least 30 minutes.',
      'Boil 6 cups of water with whole spices and 2 tsp salt. Add soaked basmati rice and par-boil until 70% cooked (firm to bite, about 5 to 6 minutes), then drain.',
      'In a heavy-bottom pot or Dutch oven, layer the marinated chicken evenly at the base.',
      'Spread the par-cooked rice over the meat layer. Top with saffron milk, remaining fried onions, chopped mint, coriander, and 2 tbsp ghee.',
      'Seal the pot tightly with aluminum foil and lid. Cook on high heat for 5 minutes, then reduce to the lowest heat on a tawa (dum) for 35 minutes.',
      'Rest for 10 minutes without opening, then gently fluff and serve hot with raita and salan.'
    ],
    substitutions: {
      chicken: 'Paneer (500g) cut into cubes, or thick soya chunks / mixed vegetables (cauliflower, carrots, potatoes). Since paneer is tender, marinate it gently and cook on dum for only 20 minutes instead of 35.',
      yogurt: '1 cup coconut milk mixed with 1 tsp lemon juice, or cashew paste whisked with water.',
      ghee: 'Neutral oil with a splash of butter, or vegan plant-based butter.',
      saffron: '1/4 tsp turmeric dissolved in 2 tbsp warm milk or water for natural golden color.'
    },
    quantities: {
      chicken: '500g bone-in chicken thighs or drumsticks',
      paneer: '500g paneer cubes',
      rice: '2 cups aged Basmati rice',
      yogurt: '1 cup plain yogurt',
      curd: '1 cup curd',
      salt: '2 teaspoons in rice water, 1 teaspoon in marinade',
      ghee: '4 tablespoons total'
    }
  },
  paneer: {
    name: 'Restaurant-Style Paneer Butter Masala',
    cuisine: 'North Indian',
    servings: 4,
    prepTime: '15 min',
    cookTime: '25 min',
    totalTime: '40 min',
    ingredients: [
      '400g fresh paneer (cut into cubes)',
      '4 large ripe tomatoes & 2 medium onions',
      '15 whole raw cashews (soaked in warm water)',
      '1.5 tbsp ginger-garlic paste',
      '2 tbsp butter & 1 tbsp oil',
      '1 tsp Kashmiri red chili powder & 1/2 tsp turmeric',
      '1 tsp garam masala & 1 tsp coriander powder',
      '1 tbsp crushed kasuri methi (dry fenugreek leaves)',
      '3 tbsp fresh cooking cream',
      '1 tsp sugar / honey to balance acidity'
    ],
    steps: [
      'Roughly chop tomatoes and onions. Sauté in 1 tsp oil with whole spices and soaked cashews for 6-8 minutes until soft, then blend into a velvety smooth puree.',
      'Melt 1 tbsp butter and 1 tbsp oil in a pan. Add ginger-garlic paste and sauté for 1 minute until fragrant.',
      'Strain the blended tomato-cashew puree into the pan for an ultra-smooth silk gravy.',
      'Add Kashmiri red chili powder, turmeric, coriander powder, and salt. Simmer on low heat for 10 minutes until butter separates slightly.',
      'Gently fold in fresh paneer cubes and simmer for 3 to 4 minutes. Do not overcook or paneer will turn chewy.',
      'Finish with crushed kasuri methi, garam masala, 1 tsp sugar, and fresh cooking cream. Stir gently and serve with warm naan or jeera rice.'
    ],
    substitutions: {
      paneer: 'Extra-firm tofu (pressed and lightly pan-seared) or boiled chickpeas (chana) for a high-protein vegan twist.',
      cream: 'Thick cashew cream (blend soaked cashews with water) or rich coconut cream.',
      butter: 'Coconut oil or vegan butter at a 1:1 ratio.',
      cashews: 'Soaked blanched almonds, sunflower seeds, or 2 tbsp melon seeds (magaz).'
    },
    quantities: {
      paneer: '400g cubed paneer',
      butter: '2 tablespoons',
      cream: '3 tablespoons fresh cream',
      tomatoes: '4 large ripe tomatoes',
      cashews: '15 pieces'
    }
  },
  pasta: {
    name: 'Creamy Garlic & Herb Penne Pasta',
    cuisine: 'Italian',
    servings: 2,
    prepTime: '10 min',
    cookTime: '15 min',
    totalTime: '25 min',
    ingredients: [
      '250g penne or fettuccine pasta',
      '4 cloves fresh garlic, minced',
      '2 tbsp unsalted butter & 1 tbsp extra virgin olive oil',
      '1 cup heavy whipping cream',
      '1/2 cup freshly grated Parmigiano-Reggiano',
      '1/2 cup reserved starchy pasta cooking water',
      'Fresh chopped parsley, black pepper, and chili flakes'
    ],
    steps: [
      'Bring a large pot of water to a rolling boil and salt generously (like the sea). Cook pasta until 1 minute shy of al dente.',
      'Reserve 1/2 cup of starchy pasta water, then drain pasta. Do not rinse with water.',
      'In a wide skillet over medium heat, melt butter with olive oil. Add minced garlic and cook for 45 seconds until fragrant and golden (do not burn).',
      'Pour in heavy cream and bring to a gentle simmer for 2 minutes until slightly reduced.',
      'Turn heat to low, stir in grated parmesan cheese until completely melted and silky.',
      'Toss the drained pasta into the sauce, adding splashes of pasta water to emulsify into a glossy glaze. Garnish with cracked black pepper and parsley.'
    ],
    substitutions: {
      'heavy cream': '1 cup whole milk whisked with 1 tbsp cornstarch and 1 tbsp butter, or blended soaked cashews with vegetable broth.',
      parmesan: 'Pecorino Romano, Grana Padano, or nutritional yeast with garlic powder.',
      pasta: 'Gluten-free penne (chickpea or brown rice pasta), or zucchini zoodles (cook for only 2 mins).'
    },
    quantities: {
      pasta: '250 grams',
      garlic: '4 cloves minced',
      cream: '1 cup heavy cream',
      parmesan: '1/2 cup grated',
      butter: '2 tablespoons'
    }
  },
  dosa: {
    name: 'Crispy South Indian Masala Dosa',
    cuisine: 'South Indian',
    servings: 4,
    prepTime: '20 min',
    cookTime: '20 min',
    totalTime: '40 min',
    ingredients: [
      '3 cups fermented dosa batter (rice and urad dal)',
      '4 large potatoes, boiled and roughly mashed',
      '1 large onion, thinly sliced',
      '2 green chilies & 1 inch ginger, finely chopped',
      '1 tsp mustard seeds, 1 tsp cumin, 1 pinch hing (asafoetida)',
      '1 sprig fresh curry leaves',
      '1/2 tsp turmeric powder & 1 tsp salt',
      'Sesame oil or ghee for frying'
    ],
    steps: [
      'Heat 1 tbsp oil in a pan. Splutter mustard seeds, cumin seeds, curry leaves, and a pinch of hing.',
      'Add sliced onions, green chilies, and ginger. Sauté until translucent, then stir in turmeric and salt.',
      'Add mashed boiled potatoes and 1/4 cup water. Mash and simmer for 3 minutes into a moist, spreadable potato masala. Turn off heat.',
      'Heat a flat cast iron tawa or non-stick griddle on medium-high until smoking hot. Splash with water droplets to temper and wipe dry.',
      'Pour a ladleful of batter in the center. Using the back of the ladle, spiral outward in a continuous motion to make a thin, even circle.',
      'Drizzle 1 tsp ghee or oil along the edges. Cook on medium heat until golden and crispy.',
      'Place a generous portion of potato masala in the center, fold over, and serve hot with coconut chutney and piping hot sambar.'
    ],
    substitutions: {
      batter: 'Instant oats or rava (semolina) batter mixed with curd and water rested for 15 minutes.',
      potatoes: 'Boiled sweet potatoes or mashed paneer/tofu with turmeric and peas.',
      ghee: 'Cold-pressed sesame (gingelly) oil or coconut oil.'
    },
    quantities: {
      batter: '3 cups fermented batter',
      potatoes: '4 large potatoes',
      onions: '1 large sliced',
      ghee: '1 teaspoon per dosa'
    }
  },
  ramen: {
    name: 'Authentic Shoyu Ramen with Soft Egg',
    cuisine: 'Japanese',
    servings: 2,
    prepTime: '20 min',
    cookTime: '25 min',
    totalTime: '45 min',
    ingredients: [
      '2 portions fresh or dried ramen noodles',
      '4 cups rich chicken or vegetable dashi broth',
      '3 tbsp Japanese soy sauce (shoyu)',
      '1 tbsp mirin & 1 tsp toasted sesame oil',
      '2 cloves garlic & 1 inch ginger, sliced',
      '2 ramen eggs (ajitsuke tamago) soft-boiled and marinated',
      'Toppings: sliced chashu or pan-fried tofu, scallions, nori seaweed, menma (bamboo shoots)'
    ],
    steps: [
      'In a saucepan, simmer dashi/chicken broth with crushed garlic, ginger, and scallion whites for 15 minutes.',
      'Prepare the tare (flavor base): whisk soy sauce, mirin, sake (optional), and sesame oil in a small bowl.',
      'Boil a separate pot of water. Cook ramen noodles according to package instructions (typically 2-3 minutes). Drain thoroughly.',
      'Divide the tare seasoning between two deep ramen bowls. Pour piping hot strained broth over the tare and whisk gently.',
      'Fold the cooked noodles into the broth using chopsticks to ensure noodles are well separated.',
      'Top with halved marinated soft-boiled eggs, scallions, nori sheets, and sliced chashu or pan-fried tofu. Serve steaming hot immediately.'
    ],
    substitutions: {
      chashu: 'Pan-seared crispy tofu slices, grilled chicken breast, or sautéed shiitake mushrooms.',
      mirin: '1 tbsp white wine or rice vinegar mixed with 1/2 tsp sugar.',
      noodles: 'Udon noodles, soba (buckwheat) noodles, or rice ramen noodles for gluten-free.'
    },
    quantities: {
      noodles: '2 portions (approx 200g)',
      broth: '4 cups',
      'soy sauce': '3 tablespoons',
      eggs: '2 soft-boiled eggs'
    }
  },
  pizza: {
    name: 'Artisan Neapolitan Margherita Pizza',
    cuisine: 'Italian',
    servings: 2,
    prepTime: '20 min',
    cookTime: '12 min',
    totalTime: '32 min',
    ingredients: [
      '300g pizza dough (fermented flour, yeast, water, salt)',
      '1/2 cup San Marzano tomato sauce (crushed tomatoes with pinch of salt)',
      '150g fresh buffalo mozzarella or fior di latte, torn',
      'Fresh whole basil leaves',
      '2 tbsp extra virgin olive oil',
      '1 tbsp semolina flour for dusting'
    ],
    steps: [
      'Preheat your oven with a pizza stone or heavy baking sheet at highest heat (500°F / 260°C) for at least 30 minutes.',
      'Dust your work surface with semolina flour. Gently stretch the dough from the center outwards using your fingertips, leaving an airy 1-inch crust (cornicione).',
      'Ladle the crushed tomato sauce onto the center and swirl outwards in a spiral, leaving the crust rim clean.',
      'Distribute torn fresh mozzarella evenly across the sauce. Drizzle 1 tbsp olive oil over top.',
      'Slide the pizza onto the blistering hot stone. Bake for 8 to 12 minutes until crust is puffed, blistered with leopard spots, and cheese is bubbling.',
      'Remove carefully, scatter fresh basil leaves over the hot cheese, drizzle with finishing olive oil, slice, and enjoy immediately.'
    ],
    substitutions: {
      mozzarella: 'Vegan meltable cashew mozzarella or dairy-free shredded mozzarella.',
      dough: 'Gluten-free pizza crust or store-bought flatbread/naan for a quick 5-minute version.',
      'tomato sauce': 'Pesto sauce or white garlic ricotta base.'
    },
    quantities: {
      dough: '300 grams',
      mozzarella: '150 grams',
      sauce: '1/2 cup'
    }
  },
  friedRice: {
    name: 'Classic Wok-Fired Chicken & Egg Fried Rice',
    cuisine: 'Asian / Chinese',
    servings: 3,
    prepTime: '15 min',
    cookTime: '10 min',
    totalTime: '25 min',
    ingredients: [
      '3 cups day-old cold cooked Jasmine rice',
      '200g chicken breast or thigh, diced small',
      '2 large eggs, beaten with a pinch of salt',
      '3 scallions (green onions), whites and greens separated',
      '2 cloves garlic & 1 tsp ginger, minced',
      '1/2 cup diced carrots and green peas',
      '2 tbsp soy sauce & 1 tsp toasted sesame oil',
      '1 tbsp oyster sauce (optional) & pinch of white pepper'
    ],
    steps: [
      'Break up clumps of day-old cold rice with your hands so every grain is separate and ready for the wok.',
      'Heat 1 tbsp oil in a wok or large skillet over high heat until smoking hot. Pour in beaten eggs, scramble quickly for 30 seconds, and set aside.',
      'Add another tablespoon of oil. Stir-fry diced chicken with garlic and ginger for 3 minutes until cooked through and lightly browned.',
      'Toss in carrots, peas, and scallion whites. Stir-fry for 1 minute until tender-crisp.',
      'Turn heat to maximum and add cold rice. Spread it out, pressing against the wok to toast the grains (wok hei) for 2 minutes.',
      'Drizzle soy sauce, oyster sauce, and sesame oil around the rim of the wok so it sizzles into the rice. Toss in scrambled eggs and scallion greens. Stir vigorously and serve piping hot.'
    ],
    substitutions: {
      chicken: 'Firm pressed tofu, peeled shrimp, or edamame beans.',
      'soy sauce': 'Tamari (gluten-free) or coconut aminos.',
      rice: 'Cooked quinoa, brown rice, or riced cauliflower.'
    },
    quantities: {
      rice: '3 cups cold rice',
      chicken: '200 grams',
      eggs: '2 large eggs',
      'soy sauce': '2 tablespoons'
    }
  },
  tacos: {
    name: 'Street-Style Charred Chicken Tinga Tacos',
    cuisine: 'Mexican',
    servings: 4,
    prepTime: '15 min',
    cookTime: '20 min',
    totalTime: '35 min',
    ingredients: [
      '8 small corn or flour tortillas',
      '400g shredded cooked chicken (rotisserie or boiled chicken)',
      '1 large onion, sliced & 2 cloves garlic',
      '2 chipotle peppers in adobo sauce + 2 tbsp adobo sauce',
      '3 Roma tomatoes, blended or crushed',
      '1/2 cup chicken stock',
      '1 avocado, sliced & crumbled cotija or feta cheese',
      'Fresh cilantro, lime wedges, and pickled red onions'
    ],
    steps: [
      'In a blender, puree the tomatoes, chipotle peppers with adobo sauce, garlic, and 1/2 cup chicken stock until smooth.',
      'Heat 1 tbsp oil in a skillet over medium heat. Sauté sliced onions for 5 minutes until soft and caramelized.',
      'Pour the chipotle-tomato sauce into the skillet and simmer for 6 minutes until slightly thickened.',
      'Add shredded chicken into the sauce, tossing until thoroughly coated and heated through. Season with salt to taste.',
      'Warm the corn tortillas on a dry hot skillet for 30 seconds per side until pliable and slightly charred.',
      'Assemble tacos: spoon warm chicken tinga onto tortillas, top with sliced avocado, crumbled cotija cheese, cilantro, and squeeze fresh lime.'
    ],
    substitutions: {
      chicken: 'Canned black beans and sautéed mushrooms, or shredded jackfruit.',
      cotija: 'Feta cheese, queso fresco, or vegan cashew parmesan.',
      tortillas: 'Butter lettuce leaves for low-carb taco cups.'
    },
    quantities: {
      chicken: '400 grams shredded',
      tortillas: '8 tortillas',
      lime: '2 fresh limes'
    }
  },
  salmon: {
    name: 'Pan-Seared Crispy Garlic Butter Salmon',
    cuisine: 'Contemporary Seafood',
    servings: 2,
    prepTime: '10 min',
    cookTime: '12 min',
    totalTime: '22 min',
    ingredients: [
      '2 skin-on fresh salmon fillets (approx 180g each)',
      '2 tbsp unsalted butter',
      '3 cloves garlic, finely minced',
      '1 tbsp olive oil',
      '1 tbsp fresh lemon juice + lemon slices for garnish',
      '2 tbsp chopped fresh parsley or dill',
      'Coarse sea salt and freshly cracked black pepper'
    ],
    steps: [
      'Pat salmon fillets completely dry with paper towels. Season both flesh and skin generously with coarse salt and black pepper.',
      'Heat olive oil in a stainless steel or cast-iron skillet over medium-high heat until shimmering hot.',
      'Place salmon skin-side down. Press down gently with a spatula for 10 seconds to ensure the skin stays flat. Sear undisturbed for 5 to 6 minutes until skin is golden and crispy.',
      'Carefully flip the fillets. Reduce heat to medium-low and add butter, minced garlic, and lemon juice into the pan.',
      'As the butter melts and foams, tilt the pan and continuously spoon the garlicky lemon butter over the salmon for 2 to 3 minutes until cooked to medium (flaky and moist).',
      'Transfer to warm plates, spoon remaining garlic butter over the fillets, garnish with fresh parsley and lemon slices, and serve.'
    ],
    substitutions: {
      salmon: 'Rainbow trout, sea bass fillets, or thick firm tofu steaks.',
      butter: 'Extra virgin olive oil with a touch of ghee or vegan butter.',
      parsley: 'Fresh dill, tarragon, or chives.'
    },
    quantities: {
      salmon: '2 fillets (360g total)',
      butter: '2 tablespoons',
      garlic: '3 cloves'
    }
  }
};

