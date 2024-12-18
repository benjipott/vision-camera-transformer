import { CameraScreen } from 'app/features/camera/screen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Camera',
        }}
      />
      <CameraScreen />
    </>
  )
}
