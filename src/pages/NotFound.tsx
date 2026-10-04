const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-muted">
    <main className="text-center">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
      <a href="/login" className="text-primary underline hover:text-primary/90">
        Ir para o login
      </a>
    </main>
  </div>
);

export default NotFound;
