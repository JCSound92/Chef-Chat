import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { RecipeView } from '../components/RecipeView';

export function RecipeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, setCurrentRecipe } = useStore();

  React.useEffect(() => {
    const recipe = recipes.find(r => r.id === id);
    if (recipe) {
      setCurrentRecipe(recipe);
    } else {
      navigate('/');
    }
  }, [id, recipes, setCurrentRecipe, navigate]);

  return <RecipeView />;
}