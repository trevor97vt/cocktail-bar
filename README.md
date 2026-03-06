# Cocktail Bar App

A cocktail discovery app that helps users find cocktails they can make with ingredients they have on hand.

**[Try the Live App](https://trevor-p-cocktail-bar.netlify.app/)**

## Core Features

### Personal Bar Management
- **Ingredient Inventory**: Add ingredients to your personal bar by searching through an extensive database
- **Smart Organization**: Ingredients are categorized by type (spirits, liqueurs, bitters, etc.)
- **Easy Management**: Add or remove ingredients with a simple, intuitive interface

### Cocktail Discovery
- **Cocktails You Can Make**: See cocktails you can actually make with your current bar setup
- **Recipe Database**: Browse all available cocktail recipes with detailed instructions
- **Ingredient Matching**: See which ingredients you're missing to make a cocktail
- **Detailed Recipe Cards**: Complete instructions, measurements, glassware, and garnish information

### Community Features
- **Submit New Cocktails**: Contribute your own recipes to the community database
- **Recipe Attribution**: See who submitted each cocktail recipe

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern Material Design**: Clean, intuitive interface
- **Fast Search**: Real-time search functionality for ingredients
- **Visual Hierarchy**: Clear organization with tabs, cards, and intuitive navigation

### User Authentication
- **Secure Login System**: Powered by Supabase Auth with email/password authentication
- **Personalized Experience**: Each user maintains their own ingredient inventory
- **Session Management**: Seamless login state persistence across sessions

## Technology Stack

### Frontend
- **React 19** - Modern React with latest features and concurrent rendering
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Comprehensive React UI component library with theming
- **Vite** - Build tool and development server

### Backend & Database
- **Supabase** - Full backend-as-a-service platform providing:
  - PostgreSQL database
  - Row Level Security (RLS) for data protection
  - Authentication and user management
  - Bucket storage (for cocktail images)

### Hosting & Deployment
- **Netlify** - Modern deployment platform with:
  - Continuous deployment from Git
  - Built-in CDN and edge optimization
  - Automatic HTTPS

## Database Schema

The app uses a relational database structure optimized for cocktail recipe management:

- **Users & Profiles**: User authentication and profile information
- **Ingredients**: Comprehensive ingredient database with categorization
- **Cocktails**: Recipe storage with instructions, notes, and metadata
- **Cocktail Ingredients**: Many-to-many relationship linking cocktails to ingredients with measurements
- **User Bar**: Personal ingredient inventory for each user

## Potential Future Improvements

I may never get around to implementing some or all of these things, but I'm aware the app lacks them:

### Short-term Enhancements
- **Advanced Filtering**: Filter cocktails by type, strength, flavor profile
- **Favorites System**: Save and organize favorite cocktail recipes
- **Recipe Rating**: Community rating and review system for cocktails
- **Ingredient Substitutions**: Suggest alternative ingredients for missing items

### User Experience
- **Recipe Photos**: Image upload and management for user-submitted cocktails or automatic AI image generation
- **Recipe Sharing**: Share cocktails via social media or direct links
- **Print-friendly Recipes**: Optimized recipe printing and PDF export

### Social & Community
- **User Profiles**: Public profiles showcasing favorite recipes and created cocktails
- **Recipe Collections**: Create and share themed cocktail collections
- **Follow System**: Follow other users and see their recipe submissions
- **Comments & Reviews**: Community feedback on recipes

### Technical Improvements
- **Offline Support**: Cache recipes for offline viewing
- **Advanced Search**: Full-text search with filters and sorting options 
- **API Integration**: Connect with external cocktail databases for a more comprehensive list of drinks

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Netlify account (for deployment)

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables for Supabase connection
4. Start development server: `npm run dev`
5. Open http://localhost:5173