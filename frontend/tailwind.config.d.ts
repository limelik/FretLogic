declare const _default: {
    content: string[];
    theme: {
        extend: {
            colors: {
                night: string;
                ink: string;
                glow: string;
                ember: string;
                gold: string;
            };
            boxShadow: {
                glow: string;
            };
            backgroundImage: {
                grain: string;
            };
            animation: {
                drift: string;
                pulseGlow: string;
                floatUp: string;
            };
            keyframes: {
                drift: {
                    '0%': {
                        transform: string;
                    };
                    '50%': {
                        transform: string;
                    };
                    '100%': {
                        transform: string;
                    };
                };
                pulseGlow: {
                    '0%,100%': {
                        boxShadow: string;
                    };
                    '50%': {
                        boxShadow: string;
                    };
                };
                floatUp: {
                    from: {
                        opacity: string;
                        transform: string;
                    };
                    to: {
                        opacity: string;
                        transform: string;
                    };
                };
            };
        };
    };
    plugins: any[];
};
export default _default;
