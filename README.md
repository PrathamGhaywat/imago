# Imago - Simple image generation frontend
Imago is a lightweight svelte app that provides a nice UI to generate images using any OpenAI compatible image generation LLM. Check it out at: https://imago.ultimatedev.space

## Features
- Simple and Clean UI and UX
- Multiple modes, such as single image generation, batch generation, and variation generation
- Supports any OpenAI compatible image generation model
- Tons of different style presets to choose from
- OpenSource

## Getting Started
1. Clone the repository:
    ```bash
    git clone https://github.com/PrathamGhaywat/imago.git
    cd imago
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Create a `.env` file in the root directory and add your OpenAI API key
    ```env 
    AI_BASE_URL=your_openai_compatible_endpoint
    AI_API_KEY=your_api_key
    ```
4. Start the development server:
    ```bash
    npm run dev
    ```
5. Open your browser and navigate to `http://localhost:5173`

## Deployment
You can deploy Imago using any hosting service. Here are the steps to build the project for production:
1. Build the project:
    ```bash
    npm run build
    ```
2. Deploy the contents of the `dist` folder to your hosting service.

## Contributing
Currently, Imago is a personal project and not open for contributions. However, feel free to fork the repository and make your own modifications!
If you find any issues or have suggestions, please open an issue on the GitHub repository.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details

## Acknowledgements
Thanks to [Hack Club](https://hackclub.com) for providing the AI models to power and develop this application!