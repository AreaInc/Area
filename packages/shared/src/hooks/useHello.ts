import { useQuery } from '@tanstack/react-query';

// Simulation of an API call
const fetchHello = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Hello from the Shared Package!";
};

export const useHello = () => {
  return useQuery({
    queryKey: ['hello'],
    queryFn: fetchHello,
  });
};
