import { Plus, Search, ChefHat } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useState, useEffect } from "react";
import { recipeAPI, ingredientAPI } from "../services/api";
import { toast } from "sonner";
import { Label } from "../components/ui/label";

export function Recipes() {
  const [user, setUser] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Prepare dish modal state
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [portionsToPrepare, setPortionsToPrepare] = useState("");

  // Create recipe modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [ingredientsList, setIngredientsList] = useState<any[]>([]);
  const [recipeName, setRecipeName] = useState("");
  const [recipeCategory, setRecipeCategory] = useState("Main Course");
  const [recipePortions, setRecipePortions] = useState("50");
  const [recipeFrequency, setRecipeFrequency] = useState("Daily");
  const [recipeCost, setRecipeCost] = useState("2500");

  // Selected single item inputs for list builder
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [selectedIngredientQty, setSelectedIngredientQty] = useState("");
  const [selectedIngredientUnit, setSelectedIngredientUnit] = useState("kg");

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      setUser(JSON.parse(userJson));
    }
    fetchRecipes();
    fetchIngredients();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const data = await recipeAPI.list();
      setRecipes(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const data = await ingredientAPI.list();
      setIngredientsList(data);
      if (data.length > 0) {
        setSelectedIngredientId(data[0].id);
        setSelectedIngredientUnit(data[0].unit);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPrepare = (recipe: any) => {
    setSelectedRecipe(recipe);
    setPortionsToPrepare(recipe.portions.toString());
    setShowPrepareModal(true);
  };

  const handlePrepareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe || !portionsToPrepare) return;

    try {
      const recipeId = selectedRecipe._id || selectedRecipe.id;
      const result = await recipeAPI.prepare(recipeId, parseInt(portionsToPrepare));
      toast.success(result.message || "Recipe preparation logged, stock deducted!");
      setShowPrepareModal(false);
      fetchRecipes();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to prepare recipe");
    }
  };

  const [formIngredients, setFormIngredients] = useState<any[]>([]);

  const handleAddIngredientRow = () => {
    if (!selectedIngredientId || !selectedIngredientQty) return;
    const ingObj = ingredientsList.find((i) => i.id === selectedIngredientId);
    if (!ingObj) return;

    setFormIngredients([
      ...formIngredients,
      {
        ingredientId: selectedIngredientId,
        name: ingObj.ingredient,
        qty: parseFloat(selectedIngredientQty),
        unit: selectedIngredientUnit,
      },
    ]);
    setSelectedIngredientQty("");
  };

  const handleAddRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formIngredients.length === 0) {
      toast.error("Please add at least one ingredient to the recipe");
      return;
    }

    try {
      const payload = {
        name: recipeName,
        category: recipeCategory,
        portions: parseInt(recipePortions),
        frequency: recipeFrequency,
        cost: parseInt(recipeCost),
        ingredients: formIngredients.map((i) => ({
          ingredientId: i.ingredientId,
          qty: i.qty,
          unit: i.unit,
        })),
      };

      await recipeAPI.create(payload);
      toast.success("Recipe created successfully!");
      setShowAddModal(false);
      setRecipeName("");
      setFormIngredients([]);
      fetchRecipes();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create recipe");
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isChefOrAdmin = user?.role === "Head Chef" || user?.role === "Admin";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Recipes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage recipe ingredients and costing
          </p>
        </div>
        {isChefOrAdmin && (
          <Button onClick={() => setShowAddModal(true)} className="sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Recipes</p>
            <p className="text-2xl font-semibold mt-1">{recipes.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Main Courses</p>
            <p className="text-2xl font-semibold mt-1">
              {recipes.filter((r) => r.category === "Main Course").length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Daily Prep</p>
            <p className="text-2xl font-semibold mt-1">
              {recipes.filter((r) => r.frequency === "Daily").length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Avg Cost/Recipe</p>
            <p className="text-2xl font-semibold mt-1">
              ₹{recipes.length > 0 ? Math.round(recipes.reduce((sum, r) => sum + (r.cost || 0), 0) / recipes.length) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recipe Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredRecipes.map((recipe) => (
          <Card key={recipe._id || recipe.id} className="shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#EFF6FF] p-3 rounded-lg">
                    <ChefHat className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recipe.category}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{recipe.frequency}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Portions:</span>
                <span className="font-medium">{recipe.portions}</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Ingredients:</p>
                <div className="space-y-1">
                  {recipe.ingredients.map((ing: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm py-1 border-t border-border"
                    >
                      <span>{ing.ingredientId?.name || ing.name || "Ingredient"}</span>
                      <span className="text-muted-foreground">
                        {ing.qty} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Total Cost:</span>
                <span className="text-lg font-semibold">
                  ₹{recipe.cost?.toLocaleString()}
                </span>
              </div>

              {isChefOrAdmin && (
                <Button className="w-full" onClick={() => handleOpenPrepare(recipe)}>
                  Prepare Dish
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prepare Dish Modal */}
      {showPrepareModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-card border border-border shadow-lg space-y-4 animate-in fade-in zoom-in duration-150">
            <h2 className="text-xl font-semibold">Prepare Dish: {selectedRecipe.name}</h2>
            <form onSubmit={handlePrepareSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portions">Portions to Prepare</Label>
                <Input
                  id="portions"
                  type="number"
                  required
                  min="1"
                  value={portionsToPrepare}
                  onChange={(e) => setPortionsToPrepare(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ingredients will be dynamically scaled and deducted from the stock ledger.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowPrepareModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Deduct Stock
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Recipe Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-card border border-border shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold">Configure Recipe</h2>
            <form onSubmit={handleAddRecipeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recName">Recipe Name</Label>
                  <Input
                    id="recName"
                    required
                    placeholder="Paneer Butter Masala"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recCat">Category</Label>
                  <Input
                    id="recCat"
                    placeholder="Appetizer, Main Course"
                    value={recipeCategory}
                    onChange={(e) => setRecipeCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recPortions">Base Portions</Label>
                  <Input
                    id="recPortions"
                    type="number"
                    value={recipePortions}
                    onChange={(e) => setRecipePortions(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recCost">Theoretical Cost (₹)</Label>
                  <Input
                    id="recCost"
                    type="number"
                    value={recipeCost}
                    onChange={(e) => setRecipeCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="border p-3 rounded-lg space-y-3">
                <p className="text-sm font-semibold border-b pb-1">Assemble Ingredients</p>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Ingredient</Label>
                    <select
                      className="w-full p-2 border rounded-md text-sm bg-background border-input"
                      value={selectedIngredientId}
                      onChange={(e) => {
                        setSelectedIngredientId(e.target.value);
                        const ing = ingredientsList.find((i) => i.id === e.target.value);
                        if (ing) setSelectedIngredientUnit(ing.unit);
                      }}
                    >
                      {ingredientsList.map((i) => (
                        <option key={i.id} value={i.id}>{i.ingredient}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 2.5"
                      value={selectedIngredientQty}
                      onChange={(e) => setSelectedIngredientQty(e.target.value)}
                    />
                  </div>
                  <Button type="button" onClick={handleAddIngredientRow}>Add Item</Button>
                </div>

                <div className="space-y-1 pt-2">
                  <p className="text-xs font-semibold">Recipe Ingredients List:</p>
                  {formIngredients.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-t">
                      <span>{item.name}</span>
                      <span>{item.qty} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Recipe
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
