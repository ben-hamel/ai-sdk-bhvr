// import SignInForm from "@/components/sign-in-form";
import SignInFormV2 from "@/components/sign-in-form-v2";
import { useNavigate } from "react-router";

export const LoginPage = () => {
  const navigate = useNavigate();

  const handleSwitchToSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignInFormV2 onSwitchToSignUp={handleSwitchToSignUp} />
      {/* <SignInForm onSwitchToSignUp={handleSwitchToSignUp} /> */}
    </div>
  );
};
