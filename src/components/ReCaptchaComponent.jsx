import ReCAPTCHA from 'react-google-recaptcha';

const ReCaptchaComponent = () => {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    try {
      const token = await window.grecaptcha.execute();
      setToken(token);
    } catch (error) {
      setError(error);
      // Retry the execute operation after a short delay
      setTimeout(handleVerify, 1000);
    }
  };

  return (
    <div>
      <ReCAPTCHA
        siteKey="YOUR_SITE_KEY"
        size="invisible"
        onVerify={handleVerify}
      />
      {token ? <div>Token: {token}</div> : null}
      {error ? <div>Error: {error}</div> : null}
    </div>
  );
};

export default ReCaptchaComponent;