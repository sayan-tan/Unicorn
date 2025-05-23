# Dashboard App

A modern, full-stack dashboard application built with JavaScript/TypeScript, React, and Next.js. This project provides code quality, security, and health insights for your repositories, with a beautiful and interactive UI.

## Features
- Code quality and security analysis
- Health and documentation insights
- Interactive dashboard UI
- Integration with GitHub
- Modern tech stack: React, Next.js, TypeScript

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn

### Environment Setup
The application requires a GitHub Personal Access Token to be set up. Follow these steps to configure your environment:

1. Create a `.env` file in the root directory of the project
2. Add your GitHub Personal Access Token to the `.env` file:
```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
```

Important notes:
- Never commit your `.env` file to version control
- Keep your tokens and secrets secure
- The `.env` file is already included in `.gitignore`

To generate a GitHub token:
1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate a new token with the following permissions:
   - `repo` (for private repositories)
   - `read:org` (for organization access)
   - `read:user` (for user data)

### Installation
```bash
# Clone the repository
git clone https://github.com/sayan-tan/dashboardApp.git
cd dashboardApp

# Install dependencies
npm install
# or
yarn install
```

### Running the App
```bash
# Start the development server
npm run dev
# or
yarn dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Project Structure
```
/ (root)
├── src/                # Application source code
├── public/             # Static assets
├── .gitignore          # Ignored files
├── README.md           # Project documentation
├── package.json        # Project metadata and scripts
└── ...
```

## Contributing
Contributions are welcome! Please open issues and submit pull requests for improvements or bug fixes.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License
This project is licensed under the MIT License.
