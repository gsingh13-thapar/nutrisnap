

# NutriSnap - AI-Powered Nutrition Tracker

A comprehensive nutrition tracking app with AI food analysis, recipe collection, and meal planning diary.

---

## Design Theme
**Health & Wellness Aesthetic**
- Fresh green color palette with nature-inspired accents
- Clean, calming layouts focused on wellness
- Soft gradients and organic shapes
- Mobile-friendly responsive design throughout

---

## Pages & Features

### 1. Landing Page
- Hero section introducing the app's AI food analysis capability
- Key feature highlights (Photo Analysis, Recipes, Food Diary)
- Call-to-action buttons for signup/login
- Testimonials or benefits section

### 2. Authentication
- Sign up and login pages
- Email/password authentication
- User profile setup (name, daily goals for calories, protein, carbs, fat)

### 3. Food Photo Analysis (Core Feature)
- Upload or take a photo of your food
- AI analyzes the image and identifies food items
- Displays estimated nutritional breakdown:
  - Total calories
  - Protein (g)
  - Carbohydrates (g)
  - Fat (g)
  - Fiber (g)
- Option to save analyzed food to your diary
- Ability to adjust portions or correct AI estimates

### 4. Recipe Collection
- Browse pre-loaded healthy recipes
- Each recipe shows:
  - Photo, title, and description
  - **Calories prominently displayed**
  - **Protein highlighted**
  - Full macro breakdown
  - Ingredients and instructions
- Add custom recipes with nutrition info
- Search and filter recipes (by calories, high protein, meal type)
- Save favorite recipes

### 5. Food Diary
- Daily meal planner view (Breakfast, Lunch, Dinner, Snacks)
- Add foods from:
  - Photo analysis results
  - Saved recipes
  - Manual entry with nutrition search
- Daily nutritional totals with progress bars toward goals
- Historical calendar view to see past days
- Weekly/monthly summary charts showing:
  - Calorie trends
  - Protein intake over time
  - Goal achievement streaks

### 6. Dashboard/Home
- Today's overview at a glance
- Progress toward daily goals
- Quick actions (analyze food, add meal, browse recipes)
- Weekly summary widget
- Recent activity feed

### 7. User Profile & Settings
- Edit personal info and nutritional goals
- Adjust daily targets (calories, protein, carbs, fat)
- View progress stats and achievements
- Account management

---

## Technical Requirements

### Backend (Lovable Cloud)
- **User authentication** with Supabase Auth
- **Database** for storing:
  - User profiles and goals
  - Food diary entries
  - Custom recipes
  - Saved/favorite recipes
  - Analyzed food history
- **AI integration** using Lovable AI (Gemini) for food photo analysis
- **File storage** for recipe images and user food photos

### AI Food Analysis
- Uses vision AI to identify food items in photos
- Estimates portion sizes and nutritional content
- Returns structured nutrition data (calories, macros)

---

## Pre-loaded Content
- 30+ healthy recipes across categories:
  - Breakfast options
  - Lunch ideas
  - Dinner recipes
  - Healthy snacks
- Each with complete nutritional information

