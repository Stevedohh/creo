import type { Meta, StoryObj } from '@storybook/react-vite';
import { Title, Text, Paragraph, Link } from './Typography';

const meta = {
  title: 'Components/Typography',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Titles: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Title level={1}>Heading 1</Title>
      <Title level={2}>Heading 2</Title>
      <Title level={3}>Heading 3</Title>
      <Title level={4}>Heading 4</Title>
      <Title level={5}>Heading 5</Title>
    </div>
  ),
};

export const TextVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Text>Default text</Text>
      <Text type="secondary">Secondary text</Text>
      <Text type="success">Success text</Text>
      <Text type="warning">Warning text</Text>
      <Text type="danger">Danger text</Text>
      <Text disabled>Disabled text</Text>
      <Text strong>Bold text</Text>
      <Text italic>Italic text</Text>
      <Text underline>Underlined text</Text>
      <Text delete>Deleted text</Text>
      <Text code>Code text</Text>
      <Text keyboard>Keyboard text</Text>
      <Text mark>Marked text</Text>
    </div>
  ),
};

export const ParagraphStory: Story = {
  name: 'Paragraph',
  render: () => (
    <div style={{ maxWidth: 600 }}>
      <Paragraph>
        Creo is an AI-powered creative platform for deepfakes, voice cloning,
        lip sync, and video editing for ads. Build stunning content with the
        power of artificial intelligence.
      </Paragraph>
      <Paragraph type="secondary">
        This is a secondary paragraph with less visual emphasis, useful for
        supplementary information and descriptions.
      </Paragraph>
    </div>
  ),
};

export const Links: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Link>Default link</Link>
      <Link type="secondary">Secondary link</Link>
      <Link type="success">Success link</Link>
      <Link type="warning">Warning link</Link>
      <Link type="danger">Danger link</Link>
    </div>
  ),
};
