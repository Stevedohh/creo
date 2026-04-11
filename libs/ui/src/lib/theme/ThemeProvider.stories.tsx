import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './ThemeProvider';
import { Button } from '../button/Button';
import { Input } from '../input/Input';
import { Title, Text } from '../typography/Typography';

const meta = {
  component: ThemeProvider,
  title: 'Theme/ThemeProvider',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ThemeProvider>;

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

function ThemeDemo() {
  const { mode, toggleTheme } = useTheme();
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          Current: {mode}
        </Title>
        <Button onClick={toggleTheme}>
          Switch to {mode === 'dark' ? 'light' : 'dark'}
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button type="primary">Primary</Button>
        <Button>Default</Button>
        <Button type="dashed">Dashed</Button>
        <Button danger>Danger</Button>
      </div>
      <Input placeholder="Input field" style={{ maxWidth: 300 }} />
      <div>
        <Text>Default text — </Text>
        <Text type="secondary">Secondary — </Text>
        <Text type="success">Success — </Text>
        <Text type="warning">Warning — </Text>
        <Text type="danger">Danger</Text>
      </div>
    </div>
  );
}

export const DarkMode: Story = {
  args: { defaultMode: 'dark' },
  render: (args) => (
    <ThemeProvider {...args}>
      <ThemeDemo />
    </ThemeProvider>
  ),
  // Override the global decorator since we provide our own ThemeProvider
  decorators: [(Story) => <Story />],
};

export const LightMode: Story = {
  args: { defaultMode: 'light' },
  render: (args) => (
    <ThemeProvider {...args}>
      <ThemeDemo />
    </ThemeProvider>
  ),
  decorators: [(Story) => <Story />],
};
