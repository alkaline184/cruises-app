# Cruises Search Application

A web application for searching and tracking cruise deals using the Cruiseway API.

## Features

- Search cruises with multiple filters:
  - Cruise Line (brand)
  - Duration
  - Port of Departure
  - Price range
- Watch functionality to track specific cruises
- Price history tracking
- Detailed cruise information view
- Price tendency analysis

## Tech Stack

- Frontend:
  - React.js
  - Material-UI
  - Axios for API requests
- Backend:
  - Node.js
  - Express.js
  - PostgreSQL database
  - pg for database connection

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=cruises_db
   ```
4. Create the PostgreSQL database:
   ```bash
   createdb cruises_db
   ```
5. Start the development servers:
   ```bash
   npm run dev:full
   ```

## API Endpoints

The application uses the following Cruiseway API endpoints:
- `http://api.cruiseway.gr/api/content/filters` - Get filter values
- `http://api.cruiseway.gr/api/cruises` - Get cruise listings

## Database Schema

The application uses a PostgreSQL database to store:
- Watched cruises
- Price history
- User preferences

## License

MIT 