import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta = {
  component: Select,
  title: 'Components/Select',
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
    },
    disabled: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    status: {
      control: 'select',
      options: ['', 'error', 'warning'],
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

const defaultOptions = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
];

export const Default: Story = {
  args: {
    placeholder: 'Select a framework',
    options: defaultOptions,
    style: { width: 200 },
  },
};

export const WithSearch: Story = {
  args: {
    placeholder: 'Search and select',
    showSearch: true,
    options: [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'rust', label: 'Rust' },
      { value: 'go', label: 'Go' },
      { value: 'java', label: 'Java' },
    ],
    filterOption: (input: string, option?: { label: string }) =>
      (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
    style: { width: 200 },
  },
};

export const Multiple: Story = {
  args: {
    mode: 'multiple',
    placeholder: 'Select tags',
    options: defaultOptions,
    style: { width: 300 },
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled select',
    options: defaultOptions,
    disabled: true,
    defaultValue: 'react',
    style: { width: 200 },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300 }}>
      <Select size="small" placeholder="Small" options={defaultOptions} />
      <Select size="middle" placeholder="Middle" options={defaultOptions} />
      <Select size="large" placeholder="Large" options={defaultOptions} />
    </div>
  ),
};
