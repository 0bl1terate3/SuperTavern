/**
 * Chat Settings Fix
 * Ensures font size, chat width, and blur settings work properly
 */

(function() {
    'use strict';

    console.log('Initializing Chat Settings Fix...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatSettings);
    } else {
        initChatSettings();
    }

    function initChatSettings() {
        // Font Size
        const fontSizeSlider = document.getElementById('font_size');
        const fontSizeCounter = document.getElementById('font_size_counter');
        
        if (fontSizeSlider && fontSizeCounter) {
            // Load saved value
            const savedFontSize = localStorage.getItem('chat_font_size') || '100';
            fontSizeSlider.value = savedFontSize;
            fontSizeCounter.value = savedFontSize;
            applyFontSize(savedFontSize);

            // Add event listeners
            fontSizeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                fontSizeCounter.value = value;
                applyFontSize(value);
                localStorage.setItem('chat_font_size', value);
            });

            fontSizeCounter.addEventListener('input', (e) => {
                const value = e.target.value;
                fontSizeSlider.value = value;
                applyFontSize(value);
                localStorage.setItem('chat_font_size', value);
            });
        }

        // Chat Width
        const chatWidthSlider = document.getElementById('chat_display_mode');
        const chatWidthCounter = document.getElementById('chat_display_mode_counter');
        
        if (chatWidthSlider && chatWidthCounter) {
            // Load saved value
            const savedChatWidth = localStorage.getItem('chat_width') || '1';
            chatWidthSlider.value = savedChatWidth;
            chatWidthCounter.value = savedChatWidth;
            applyChatWidth(savedChatWidth);

            // Add event listeners
            chatWidthSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                chatWidthCounter.value = value;
                applyChatWidth(value);
                localStorage.setItem('chat_width', value);
            });

            chatWidthCounter.addEventListener('input', (e) => {
                const value = e.target.value;
                chatWidthSlider.value = value;
                applyChatWidth(value);
                localStorage.setItem('chat_width', value);
            });
        }

        // Blur Intensity
        const blurSlider = document.getElementById('blur_intensity');
        const blurCounter = document.getElementById('blur_intensity_counter');
        
        if (blurSlider && blurCounter) {
            // Load saved value
            const savedBlur = localStorage.getItem('blur_intensity') || '5';
            blurSlider.value = savedBlur;
            blurCounter.value = savedBlur;
            applyBlur(savedBlur);

            // Add event listeners
            blurSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                blurCounter.value = value;
                applyBlur(value);
                localStorage.setItem('blur_intensity', value);
            });

            blurCounter.addEventListener('input', (e) => {
                const value = e.target.value;
                blurSlider.value = value;
                applyBlur(value);
                localStorage.setItem('blur_intensity', value);
            });
        }

        // No Blur checkbox
        const noBlurCheckbox = document.getElementById('fast_ui_mode');
        if (noBlurCheckbox) {
            const savedNoBlur = localStorage.getItem('no_blur') === 'true';
            noBlurCheckbox.checked = savedNoBlur;
            applyNoBlur(savedNoBlur);

            noBlurCheckbox.addEventListener('change', (e) => {
                const checked = e.target.checked;
                applyNoBlur(checked);
                localStorage.setItem('no_blur', checked);
            });
        }

        console.log('Chat Settings Fix initialized successfully');
    }

    /**
     * Apply font size to chat messages
     */
    function applyFontSize(size) {
        const percentage = parseInt(size);
        document.documentElement.style.setProperty('--chat-font-size', `${percentage}%`);
        
        // Also apply directly to chat elements
        const style = document.getElementById('chat-font-size-style') || document.createElement('style');
        style.id = 'chat-font-size-style';
        style.textContent = `
            #chat .mes,
            #chat .mes_text,
            #chat .mes_block {
                font-size: ${percentage}% !important;
            }
        `;
        if (!style.parentNode) {
            document.head.appendChild(style);
        }
    }

    /**
     * Apply chat width
     */
    function applyChatWidth(width) {
        const widthValue = parseInt(width);
        let maxWidth;
        
        switch(widthValue) {
            case 0: // Narrow
                maxWidth = '800px';
                break;
            case 1: // Medium (default)
                maxWidth = '1000px';
                break;
            case 2: // Wide
                maxWidth = '1400px';
                break;
            default:
                maxWidth = '1000px';
        }

        document.documentElement.style.setProperty('--chat-max-width', maxWidth);
        
        const style = document.getElementById('chat-width-style') || document.createElement('style');
        style.id = 'chat-width-style';
        style.textContent = `
            #chat {
                max-width: ${maxWidth} !important;
                margin: 0 auto;
            }
            .mes_block {
                max-width: 100% !important;
            }
        `;
        if (!style.parentNode) {
            document.head.appendChild(style);
        }
    }

    /**
     * Apply blur intensity
     */
    function applyBlur(intensity) {
        const blurValue = parseInt(intensity);
        const blurPx = blurValue + 'px';
        
        document.documentElement.style.setProperty('--blur-strength', blurPx);
        
        const style = document.getElementById('blur-intensity-style') || document.createElement('style');
        style.id = 'blur-intensity-style';
        style.textContent = `
            .drawer-content,
            .mes,
            #sheld,
            .zoomed_avatar,
            #top-bar,
            #left-nav-panel,
            #right-nav-panel,
            .popup,
            .dialogue_popup {
                backdrop-filter: blur(${blurPx}) !important;
                -webkit-backdrop-filter: blur(${blurPx}) !important;
            }
        `;
        if (!style.parentNode) {
            document.head.appendChild(style);
        }
    }

    /**
     * Apply or remove blur entirely
     */
    function applyNoBlur(noBlur) {
        if (noBlur) {
            document.body.classList.add('no-blur');
            const style = document.getElementById('no-blur-style') || document.createElement('style');
            style.id = 'no-blur-style';
            style.textContent = `
                body.no-blur .drawer-content,
                body.no-blur .mes,
                body.no-blur #sheld,
                body.no-blur .zoomed_avatar,
                body.no-blur #top-bar,
                body.no-blur #left-nav-panel,
                body.no-blur #right-nav-panel,
                body.no-blur .popup,
                body.no-blur .dialogue_popup {
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                }
            `;
            if (!style.parentNode) {
                document.head.appendChild(style);
            }
        } else {
            document.body.classList.remove('no-blur');
            const style = document.getElementById('no-blur-style');
            if (style) {
                style.remove();
            }
            // Reapply current blur setting
            const savedBlur = localStorage.getItem('blur_intensity') || '5';
            applyBlur(savedBlur);
        }
    }

})();
