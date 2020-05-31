function ejemplo_1(X,Y,varargin)
   fprintf('Total de argumentos de entrada = %d\n',nargin);

   nVarargs = length(varargin);
   fprintf('Entradas en varargin: %d\n',nVarargs)
   for k = 1:nVarargs
      fprintf('   %d\n', varargin{k})
   end
end