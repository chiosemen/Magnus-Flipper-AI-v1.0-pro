import { View, Text } from 'react-native';

export default function Home(){
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0F14', padding: 16 }}>
      <Text style={{ color: '#E6F6FF', fontSize: 28, fontWeight: '900' }}>Magnus AI</Text>
      <Text style={{ color: '#8CA8B8', marginTop: 8 }}>Scan, Flip, and Profit Smarter.</Text>
    </View>
  );
}
