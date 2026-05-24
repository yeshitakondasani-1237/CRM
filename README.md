# BDA Sales & CRM System (MERN Stack)

A modern, high-performance BDA (Business Development Associate) Sales and CRM Dashboard designed with premium glassmorphic aesthetics. Features real-time lead tracking, dynamic rankings, workflow automation, and notifications.

## Project Structure
- `/server`: Node.js/Express API connected to MongoDB Atlas.
- `/client`: React, Vite, Redux Toolkit, and Material-UI dashboard.

---

## 🚀 How to Run the Project Locally

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Git** (for version control)
- **MongoDB Atlas** database account

---

### 2. Running the Backend Server

1. Open your terminal and navigate to the `server` folder:
   ```bash
   cd server
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Configure the Environment Variables:
   - Create a `.env` file inside the `server/` directory.
   - Add the following configuration:
     ```env
     PORT=5000
     NODE_ENV=development
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_secret_jwt_key
     ```
     *(Note: If you encounter DNS SRV errors with the standard Atlas URI, use the replica-set URL format).*

4. Start the development server:
   ```bash
   npm run dev
   ```
   *The server should run on `http://localhost:5000`.*

---

### 3. Running the Frontend Client

1. Open a new terminal window/tab and navigate to the `client` folder:
   ```bash
   cd client
   ```
2. Install the client dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The client should run on `http://localhost:3000` (or `3001` if port 3000 is occupied).*

---

## 📦 How to Upload this Project to GitHub

Follow these steps in your terminal inside the root directory (`/Internship project`):

1. **Initialize Git Repository**:
   ```bash
   git init
   ```
2. **Add Files to Staging**:
   ```bash
   git add .
   ```
   *(Note: The root `.gitignore` will automatically prevent uploading your `.env` file and `node_modules` folders, keeping your database credentials secure).*

3. **Commit the Code**:
   ```bash
   git commit -m "feat: Connect to MongoDB Atlas, add public registration flow"
   ```

4. **Create a Remote Repository on GitHub**:
   - Go to [github.com](https://github.com/) and create a new repository (do not check "Initialize with README", "Add .gitignore", or "Choose a license").

5. **Link and Push Your Code**:
   - Run the following commands (replace `<username>` and `<repository-name>` with your GitHub details):
   ```bash
   git branch -M main
   git remote add origin https://github.com/<username>/<repository-name>.git
   git push -u origin main
   ```
