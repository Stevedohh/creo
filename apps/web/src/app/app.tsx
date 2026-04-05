import { Button, Input, Title, Text } from '@org/ui';

export function App() {
  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px' }}>
      <Title level={2}>Creo</Title>
      <Text type="secondary">
        Welcome to Creo — NX monorepo with NestJS + React + Ant Design
      </Text>
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Input placeholder="Type something..." />
        <Button type="primary">Submit</Button>
      </div>
    </div>
  );
}

export default App;
