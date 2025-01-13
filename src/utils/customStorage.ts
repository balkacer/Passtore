import AsyncStorage from "@react-native-async-storage/async-storage";

const customStorage = {
  getItem: async <T extends object>(name: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(name);
    return value ? JSON.parse(value) as T : null;
  },
  setItem: async(name: string, value: any) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};

export default customStorage;