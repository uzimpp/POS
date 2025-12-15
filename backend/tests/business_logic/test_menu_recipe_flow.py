"""
Business Logic Tests: Menu/Recipe/Ingredient Flow
Tests menu configuration, recipe management, and ingredient dependencies
"""
import pytest
from decimal import Decimal


class TestMenuRecipeIngredientFlow:
    """
    Test Flow 3: Menu/Recipe/Ingredient Flow
    Ingredient Creation → Menu Creation → Recipe Linking → Dependency Management
    """
    
    def test_complete_menu_creation_flow(self, client, test_db):
        """
        Test: Complete flow from ingredient to menu with recipe
        
        Steps:
        1. Create ingredients
        2. Create menu item
        3. Link menu to ingredients via recipe
        4. Verify menu is available
        """
        # Step 1: Create ingredients
        ingredient1_response = client.post("/api/ingredients/", json={
            "name": "เนื้อหมู",
            "base_unit": "kg"
        })
        ingredient1_id = ingredient1_response.json()["ingredient_id"]
        
        ingredient2_response = client.post("/api/ingredients/", json={
            "name": "ข้าวสาร",
            "base_unit": "kg"
        })
        ingredient2_id = ingredient2_response.json()["ingredient_id"]
        
        # Step 2: Create menu item
        menu_response = client.post("/api/menu/", json={
            "name": "ข้าวผัดหมู",
            "type": "FOOD",
            "category": "อาหารจานหลัก",
            "price": 60.0,
            "is_available": True
        })
        assert menu_response.status_code == 201
        menu_data = menu_response.json()
        menu_id = menu_data["menu_item_id"]
        
        # Step 3: Create recipes (link menu to ingredients)
        recipe1_response = client.post("/api/recipe/", json={
            "menu_item_id": menu_id,
            "ingredient_id": ingredient1_id,
            "qty_per_unit": 0.15  # 150g pork per dish
        })
        assert recipe1_response.status_code == 201
        
        recipe2_response = client.post("/api/recipe/", json={
            "menu_item_id": menu_id,
            "ingredient_id": ingredient2_id,
            "qty_per_unit": 0.2  # 200g rice per dish
        })
        assert recipe2_response.status_code == 201
        
        # Step 4: Verify menu details
        menu_detail = client.get(f"/api/menu/{menu_id}")
        assert menu_detail.status_code == 200
        data = menu_detail.json()
        assert data["is_available"] == True
        
        # Step 5: Verify recipes via separate API call
        recipes_response = client.get(f"/api/recipe/menu-item/{menu_id}")
        assert recipes_response.status_code == 200
        recipes = recipes_response.json()
        assert len(recipes) == 2
    
    def test_ingredient_deletion_affects_menu_availability(self, client, test_db, 
                                                            sample_menu_item, sample_recipe):
        """
        Test: Deleting ingredient makes dependent menu items unavailable
        
        Steps:
        1. Create menu with recipe
        2. Delete ingredient
        3. Verify menu item becomes unavailable
        """
        # Step 1: Verify menu is initially available
        assert sample_menu_item.is_available == True
        
        # Step 2: Delete ingredient
        ingredient_id = sample_recipe.ingredient_id
        delete_response = client.delete(f"/api/ingredients/{ingredient_id}")
        assert delete_response.status_code == 200
        
        # Step 3: Verify menu item is now unavailable
        menu_response = client.get(f"/api/menu/{sample_menu_item.menu_item_id}")
        menu_data = menu_response.json()
        assert menu_data["is_available"] == False
    
    def test_restore_ingredient_requires_manual_menu_restore(self, client, test_db, 
                                                              sample_menu_item, sample_recipe, 
                                                              sample_ingredient):
        """
        Test: Restoring ingredient does NOT auto-restore menu availability
        Menu must be manually set to available after restoring ingredient.
        
        Steps:
        1. Delete ingredient (menu becomes unavailable)
        2. Restore ingredient
        3. Verify menu is still unavailable (requires manual restore)
        4. Manually restore menu availability
        5. Verify menu is now available
        """
        # Step 1: Delete ingredient via API (which sets menu unavailable)
        delete_response = client.delete(f"/api/ingredients/{sample_ingredient.ingredient_id}")
        assert delete_response.status_code == 200
        
        # Verify menu is unavailable
        menu_response = client.get(f"/api/menu/{sample_menu_item.menu_item_id}")
        assert menu_response.json()["is_available"] == False
        
        # Step 2: Restore ingredient
        restore_response = client.put(f"/api/ingredients/{sample_ingredient.ingredient_id}/restore")
        assert restore_response.status_code == 200
        
        # Step 3: Verify menu is STILL unavailable (no auto-restore)
        menu_response = client.get(f"/api/menu/{sample_menu_item.menu_item_id}")
        assert menu_response.json()["is_available"] == False
        
        # Step 4: Manually restore menu availability
        update_response = client.put(f"/api/menu/{sample_menu_item.menu_item_id}", json={
            "name": sample_menu_item.name,
            "type": sample_menu_item.type,
            "category": sample_menu_item.category,
            "price": float(sample_menu_item.price),
            "is_available": True
        })
        assert update_response.status_code == 200
        
        # Step 5: Verify menu is now available
        menu_response = client.get(f"/api/menu/{sample_menu_item.menu_item_id}")
        assert menu_response.json()["is_available"] == True
    
    def test_menu_with_multiple_ingredients(self, client, test_db):
        """
        Test: Menu requiring multiple ingredients - delete one makes menu unavailable
        Restore ingredient does NOT auto-restore menu (requires manual restore)
        
        Steps:
        1. Create menu with 3 ingredients
        2. Delete one ingredient
        3. Verify menu becomes unavailable
        4. Restore ingredient
        5. Verify menu is still unavailable (no auto-restore)
        6. Manually restore menu
        7. Verify menu is now available
        """
        # Step 1: Create ingredients and menu
        ingredients = []
        for i, name in enumerate(["กุ้ง", "ผักกาด", "น้ำมัน"]):
            ing_response = client.post("/api/ingredients/", json={
                "name": name,
                "base_unit": "g"
            })
            ingredients.append(ing_response.json()["ingredient_id"])
        
        menu_response = client.post("/api/menu/", json={
            "name": "ผัดผักกาดกุ้ง",
            "type": "FOOD",
            "category": "อาหาร",
            "price": 80.0,
            "is_available": True
        })
        menu_id = menu_response.json()["menu_item_id"]
        
        # Create recipes
        for ing_id in ingredients:
            client.post("/api/recipe/", json={
                "menu_item_id": menu_id,
                "ingredient_id": ing_id,
                "qty_per_unit": 0.1
            })
        
        # Step 2: Delete one ingredient
        client.delete(f"/api/ingredients/{ingredients[0]}")
        
        # Step 3: Verify menu unavailable
        menu_detail = client.get(f"/api/menu/{menu_id}")
        assert menu_detail.json()["is_available"] == False
        
        # Step 4: Restore ingredient
        restore_response = client.put(f"/api/ingredients/{ingredients[0]}/restore")
        assert restore_response.status_code == 200
        
        # Step 5: Verify menu is STILL unavailable (no auto-restore)
        menu_detail = client.get(f"/api/menu/{menu_id}")
        assert menu_detail.json()["is_available"] == False
        
        # Step 6: Manually restore menu availability
        update_response = client.put(f"/api/menu/{menu_id}", json={
            "name": "ผัดผักกาดกุ้ง",
            "type": "FOOD",
            "category": "อาหาร",
            "price": 80.0,
            "is_available": True
        })
        assert update_response.status_code == 200
        
        # Step 7: Verify menu is now available
        menu_detail = client.get(f"/api/menu/{menu_id}")
        assert menu_detail.json()["is_available"] == True
    
    def test_update_recipe_quantity(self, client, test_db, sample_recipe):
        """
        Test: Update recipe ingredient quantity
        
        Steps:
        1. Create recipe with initial qty
        2. Update qty_per_unit
        3. Verify update successful
        """
        # Step 1: Initial recipe
        initial_qty = float(sample_recipe.qty_per_unit)
        
        # Step 2: Update quantity
        new_qty = 0.25
        update_response = client.put(f"/api/recipe/{sample_recipe.id}", json={
            "menu_item_id": sample_recipe.menu_item_id,
            "ingredient_id": sample_recipe.ingredient_id,
            "qty_per_unit": new_qty
        })
        assert update_response.status_code == 200
        
        # Step 3: Verify update
        data = update_response.json()
        assert float(data["qty_per_unit"]) == new_qty
    
    def test_delete_recipe_link(self, client, test_db, sample_recipe):
        """
        Test: Remove ingredient from menu recipe
        
        Steps:
        1. Create recipe link
        2. Delete recipe
        3. Verify link removed
        """
        recipe_id = sample_recipe.id
        
        # Step 2: Delete recipe
        delete_response = client.delete(f"/api/recipe/{recipe_id}")
        assert delete_response.status_code == 200
        
        # Step 3: Verify removed
        get_response = client.get(f"/api/recipe/{recipe_id}")
        assert get_response.status_code == 404
    
    def test_menu_price_update_flow(self, client, test_db, sample_menu_item):
        """
        Test: Update menu item price
        
        Steps:
        1. Create menu with price
        2. Update price
        3. Create new order
        4. Verify new order uses updated price
        """
        # Step 1: Initial price
        initial_price = float(sample_menu_item.price)
        
        # Step 2: Update price
        new_price = 150.0
        update_response = client.put(f"/api/menu/{sample_menu_item.menu_item_id}", json={
            "name": sample_menu_item.name,
            "type": sample_menu_item.type,
            "category": sample_menu_item.category,
            "price": new_price,
            "is_available": True
        })
        assert update_response.status_code == 200
        
        # Step 3 & 4: Create order and verify price
        # (Would need full order setup, simplified here)
        menu_detail = client.get(f"/api/menu/{sample_menu_item.menu_item_id}")
        assert float(menu_detail.json()["price"]) == new_price
    
    def test_menu_category_filtering(self, client):
        """
        Test: Filter menu items by category
        
        Steps:
        1. Create menu items in different categories
        2. Query by specific category
        3. Verify only that category returned
        """
        # Step 1: Create items in different categories
        categories = ["อาหาร", "เครื่องดื่ม", "ของหวาน"]
        menu_ids = {}
        
        for category in categories:
            response = client.post("/api/menu/", json={
                "name": f"เมนู{category}",
                "type": "FOOD",
                "category": category,
                "price": 50.0,
                "is_available": True
            })
            menu_ids[category] = response.json()["menu_item_id"]
        
        # Step 2 & 3: Query each category
        for category in categories:
            response = client.get(f"/api/menu/?category={category}")
            assert response.status_code == 200
            data = response.json()
            
            # All returned items should be in this category
            assert all(item["category"] == category for item in data)
            
            # Should include the item we created
            assert any(item["menu_item_id"] == menu_ids[category] for item in data)
    
    def test_menu_availability_toggle(self, client, test_db, sample_menu_item):
        """
        Test: Toggle menu item availability manually
        
        Steps:
        1. Create available menu
        2. Mark as unavailable
        3. Try to order (should fail)
        4. Mark as available
        5. Order successfully
        """
        # Step 1: Initially available
        assert sample_menu_item.is_available == True
        
        # Step 2: Mark unavailable
        update_response = client.put(f"/api/menu/{sample_menu_item.menu_item_id}", json={
            "name": sample_menu_item.name,
            "type": sample_menu_item.type,
            "category": sample_menu_item.category,
            "price": float(sample_menu_item.price),
            "is_available": False
        })
        assert update_response.status_code == 200
        
        # Step 3: Try to order (would fail - need full setup)
        test_db.refresh(sample_menu_item)
        assert sample_menu_item.is_available == False
        
        # Step 4: Mark available again
        update_response = client.put(f"/api/menu/{sample_menu_item.menu_item_id}", json={
            "name": sample_menu_item.name,
            "type": sample_menu_item.type,
            "category": sample_menu_item.category,
            "price": float(sample_menu_item.price),
            "is_available": True
        })
        assert update_response.status_code == 200
        
        # Step 5: Verify available
        test_db.refresh(sample_menu_item)
        assert sample_menu_item.is_available == True



