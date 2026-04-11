import type { Preview } from '@storybook/react-vite';
import { ThemeProvider } from '../src/lib/theme/ThemeProvider';
import React from 'react';

const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(
        ThemeProvider,
        { defaultMode: 'dark' },
        React.createElement(
          'div',
          { style: { padding: 24 } },
          React.createElement(Story)
        )
      ),
  ],
  parameters: {
    backgrounds: { disable: true },
  },
};

export default preview;
