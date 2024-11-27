import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '40px',
          backgroundColor: '#1a1a1a',
          position: 'relative',
        }}
      >
        {/* Blue message bubble */}
        <div style={{
          backgroundColor: '#0B93F6',
          padding: '12px 24px',
          borderRadius: '20px',
          marginBottom: '16px',
          color: 'white',
          fontSize: 24,
          fontFamily: '-apple-system',
          maxWidth: '70%',
          alignSelf: 'flex-end'
        }}>
          Hey, have you heard of this app?
        </div>

        {/* Gray message bubble */}
        <div style={{
          backgroundColor: '#3E4042',
          padding: '12px 24px',
          borderRadius: '20px',
          marginBottom: '16px',
          color: 'white',
          fontSize: 24,
          fontFamily: '-apple-system',
          maxWidth: '70%'
        }}>
          Yeah, you can have a group chat with famous people
        </div>

        {/* Blue message bubble */}
        <div style={{
          backgroundColor: '#0B93F6',
          padding: '12px 24px',
          borderRadius: '20px',
          marginBottom: '16px',
          color: 'white',
          fontSize: 24,
          fontFamily: '-apple-system',
          maxWidth: '70%',
          alignSelf: 'flex-end'
        }}>
          Wow, that's sick
        </div>

        {/* Blue message bubble */}
        <div style={{
          backgroundColor: '#0B93F6',
          padding: '12px 24px',
          borderRadius: '20px',
          marginBottom: '16px',
          color: 'white',
          fontSize: 24,
          fontFamily: '-apple-system',
          maxWidth: '70%',
          alignSelf: 'flex-end'
        }}>
          How does it work?
        </div>

        {/* Gray message bubble */}
        <div style={{
          backgroundColor: '#3E4042',
          padding: '12px 24px',
          borderRadius: '20px',
          marginBottom: '16px',
          color: 'white',
          fontSize: 24,
          fontFamily: '-apple-system',
          maxWidth: '70%'
        }}>
          You just create a group chat with whoever you want and start talking to them
        </div>

        {/* Blue message bubble */}
        <div style={{
          backgroundColor: '#0B93F6',
          padding: '12px 24px',
          borderRadius: '20px',
          marginBottom: '16px',
          color: 'white',
          fontSize: 24,
          fontFamily: '-apple-system',
          maxWidth: '70%',
          alignSelf: 'flex-end'
        }}>
          Nice
        </div>

        {/* Dialog.ue text in bottom left corner */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '40px',
          color: 'white',
          fontSize: 48,
          fontFamily: '-apple-system',
          fontWeight: 'bold',
        }}>
          Dialog.ue
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

