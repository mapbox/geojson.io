import { Toaster } from 'react-hot-toast';

export default function Notifications() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className:
          'dark:bg-gray-900 dark:text-white dark:ring-1 dark:ring-gray-500 rounded-md',
        duration: 5000,
        success: {
          duration: 3000,
          iconTheme: {
            primary: 'green',
            secondary: 'white'
          }
        }
      }}
    />
  );
}
