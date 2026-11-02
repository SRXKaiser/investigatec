import { Link } from 'react-router-dom';

interface AuthFooterProps {
  texto: string;
  linkTexto: string;
  linkTo: string;
}

const AuthFooter = ({ texto, linkTexto, linkTo }: AuthFooterProps) => {
  return (
    <p className="text-xs text-center text-[var(--bg)]/70 w-72">
      {texto}{' '}
      <Link
        to={linkTo}
        className="text-[var(--rosita)] font-semibold
                   hover:text-[var(--bg)] hover:[text-shadow:10_10_8px_var(--rey)] transition-all duration-100"
      >
        {linkTexto}
      </Link>
    </p>
  );
};

export default AuthFooter;