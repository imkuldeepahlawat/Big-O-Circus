# Big O Circus 🎪

<div align="center">
  <p><i>Visualize and understand algorithms and data structures through interactive animations</i></p>
  
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge&logo=vercel)](https://circus.kuldeepahlawat.in/)
  [![GitHub Stars](https://img.shields.io/github/stars/imkuldeepahlawat/Big-O-Circus?style=for-the-badge&logo=github)](https://github.com/imkuldeepahlawat/Big-O-Circus/stargazers)
  [![License](https://img.shields.io/github/license/imkuldeepahlawat/Big-O-Circus?style=for-the-badge)](LICENSE)
</div>

## 📋 Overview

Big O Circus is an interactive web application designed to help users understand algorithms and data structures through visual animations and explanations. The project aims to make complex computer science concepts more accessible and engaging through interactive demonstrations.

### ✨ Features

- **Interactive Visualizations**: See algorithms and data structures in action
- **Categorized Learning**: Explore different categories of algorithms and data structures
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Intuitive UI**: User-friendly interface with smooth animations
- **Educational Content**: Learn about time and space complexity

## 🚀 Live Demo

Visit the live application: [https://circus.kuldeepahlawat.in/](https://circus.kuldeepahlawat.in/)

## 🛠️ Technologies Used

- **Frontend**: React, TypeScript, TailwindCSS
- **Animation**: Framer Motion, CSS Animations
- **UI Components**: Shadcn UI
- **Icons**: React Icons
- **Build Tool**: Vite
- **Package Manager**: Yarn

## 📦 Installation

### Prerequisites

- Node.js (v20.11.0 or higher)
- Yarn (v1.22.22 or higher)

### Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/imkuldeepahlawat/Big-O-Circus.git
   cd Big-O-Circus
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Start the development server:

   ```bash
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Docker Setup

You can also run the application using Docker:

```bash
# Build the Docker image
docker build -t big-o-circus-app .

# Run the container
docker run --name big-o-circus-app -p 8080:80 -d big-o-circus-app
```

Then visit `http://localhost:8080` in your browser.

## 📂 Project Structure

```
Big-O-Circus/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Shadcn UI components
│   │   └── ...              # Other components
│   ├── helpers/             # Helper functions and constants
│   ├── pages/               # Page components
│   │   ├── Home.tsx         # Home page
│   │   ├── DataStructuresDashboard.tsx  # Data structures dashboard
│   │   ├── AlgorithmsDashboard.tsx      # Algorithms dashboard
│   │   └── ...              # Individual algorithm/data structure pages
│   ├── types/               # TypeScript type definitions
│   ├── App.css              # Global styles and animations
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── .gitignore               # Git ignore file
├── index.html               # HTML entry point
├── package.json             # Project dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

## 🧩 Available Data Structures and Algorithms

### Data Structures

- Arrays
- Linked Lists
- Stacks
- Queues
- Trees (Binary, BST, AVL)
- Graphs
- Hash Tables
- Heaps
- And more...

### Algorithms

- Sorting (Bubble, Merge, Quick, etc.)
- Searching (Binary, Linear)
- Graph Algorithms (BFS, DFS)
- Dynamic Programming
- And more...

## 🤝 Contributing

We welcome contributions from the community! Here's how you can contribute:

### Getting Started

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b username/feature/feature-name
   ```
   or for fixes:
   ```bash
   git checkout -b username/fix/fix-name
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some feature'
   ```
4. Push to the branch:
   ```bash
   git push origin username/feature/feature-name
   ```
5. Open a Pull Request targeting the `dev` branch

### Contribution Guidelines

- Always pull from `main` before creating a new branch or PR
- Follow the existing code style and naming conventions
- Write clear, descriptive commit messages
- Add appropriate comments to your code
- Update documentation as needed
- Add tests for new features when possible

### Adding a New Algorithm or Data Structure

1. Create a new component in the appropriate directory
2. Follow the existing pattern for visualization components
3. Add the new item to the constants file in the helpers directory
4. Update the dashboard to include the new item
5. Add appropriate animations and explanations

## 📝 Code Style Guidelines

- Use TypeScript for type safety
- Follow React best practices and hooks
- Use TailwindCSS for styling
- Keep components small and focused
- Use meaningful variable and function names
- Add JSDoc comments for functions and components

## 🔄 Development Workflow

1. Pick an issue to work on or create a new one
2. Discuss approach in the issue thread if needed
3. Create a branch following the naming convention
4. Implement your changes
5. Test thoroughly
6. Create a pull request to the `dev` branch
7. Address review feedback
8. Once approved, your changes will be merged

## 📚 Learning Resources

If you're new to algorithms and data structures, here are some resources to help you get started:

- [Introduction to Algorithms](https://mitpress.mit.edu/books/introduction-algorithms-third-edition)
- [Visualgo](https://visualgo.net/en) - Algorithm visualization
- [GeeksforGeeks](https://www.geeksforgeeks.org/) - Data structures and algorithms tutorials
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/) - Time and space complexity reference

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Icons](https://react-icons.github.io/react-icons/)

## 📞 Contact

- Kuldeep Ahlawat - [LinkedIn](https://www.linkedin.com/in/imkuldeepahlawat/)
- Project Link: [https://github.com/imkuldeepahlawat/Big-O-Circus](https://github.com/imkuldeepahlawat/Big-O-Circus)

---

<div align="center">
  <p>Made with ❤️ by Kuldeep Ahlawat</p>
  <p>If you found this project helpful, please consider giving it a ⭐</p>
</div>
