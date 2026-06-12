import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      padding: '2rem'
    }}>
      <SignUp 
        path="/sign-up" 
        routing="path" 
        signInUrl="/sign-in" 
        fallbackRedirectUrl="/student"
      />
    </div>
  );
}
