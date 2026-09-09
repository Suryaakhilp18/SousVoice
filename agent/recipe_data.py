"""Small, self-contained sample recipe + substitution knowledge used by the
demo. Kept tiny and hand-authored on purpose: this is a hackathon voice
product, not a recipe database product, and the interruption engineering is
the point, not the content.
"""

RECIPE = {
    "name": "Weeknight Buttermilk Pancakes",
    "servings": 2,
    "steps": [
        "Whisk 1 cup flour, 1 tablespoon sugar, 1 teaspoon baking powder, "
        "half a teaspoon baking soda, and a pinch of salt in a bowl.",
        "In a separate bowl, whisk 1 cup buttermilk, 1 egg, and 2 tablespoons "
        "melted butter.",
        "Pour the wet ingredients into the dry ingredients and stir until just "
        "combined. A few lumps are fine.",
        "Heat a griddle or non-stick pan over medium heat and lightly grease it.",
        "Pour a quarter cup of batter per pancake. Cook until bubbles form on "
        "the surface, about two to three minutes.",
        "Flip and cook the other side until golden, about one to two minutes "
        "more.",
    ],
}

# Ground truth used by the "long lookup" tool. In the real product this would
# call an external ingredient/nutrition API; here it is a local dict so the
# demo and tests are fully offline and reproducible.
SUBSTITUTIONS = {
    "buttermilk": "1 cup milk mixed with 1 tablespoon lemon juice or white "
    "vinegar, rested for 5 minutes.",
    "butter": "an equal amount of neutral oil, or margarine at a 1:1 ratio.",
    "egg": "3 tablespoons of aquafaba (chickpea brine), whisked until frothy.",
    "baking powder": "1/4 teaspoon baking soda plus 1/2 teaspoon cream of "
    "tartar per teaspoon of baking powder called for.",
}

QUANTITIES = {
    "egg": "1 egg",
    "eggs": "1 egg",
    "flour": "1 cup",
    "buttermilk": "1 cup",
    "butter": "2 tablespoons, melted",
    "sugar": "1 tablespoon",
    "salt": "a pinch",
}
