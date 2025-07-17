const groceryListRoutes = express.Router();

const {
  MAP_PATH,
  PRODUCTS_PATH,
  SEARCH_PATH,
} = require("../utils/backend_paths.js");
const baseUrl = process.env.SPOONACULAR_BASE_URL;

// Map ingredient item to grocery products
groceryListRoutes.get(`${MAP_PATH}:userId`, async (req, res) => {
  const { ingredient } = req.query;

  try {
    const response = await axios.get(
      `${baseUrl}${PRODUCTS_PATH}${SEARCH_PATH}`,
      {
        params: {
          apiKey,
          query: ingredient,
          number: 3, // Number of results
          addProductInformation: true,
          sort: "price",
          sortDirection: "asc",
        },
      }
    );

    if (response.data.products && response.data.products.length > 0) {
      // Get cheapest result
      const product = response.data.products[0];
      return {
        name: product.title,
        id: product.id,
        price: product.price / 100,
        imgUrl: product.image,
        nutrition: {
          calories: product.nutrition.calories || 0,
          protein: protein.nutrition.protein || 0,
          carbs: protein.nutrition.carbohydrates || 0,
          fat: product.nutrition.fat || 0,
        },
      };
    }
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching product",
    });
  }
});

module.exports = groceryListRoutes;
