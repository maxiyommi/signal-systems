
x = triangularPulse(-4,0,4,3);
h = rectangularPulse(-1,0,1);
% h=@(t) 1.0*(t>-1)-1.0*(t>1);
% delta=0.0001;
% th=-5:delta:6; %tx=(-200:300)*delta;
% tx=-5:delta:6; % ty=(-100:300)*delta;
% 
% plot(tx,x(tx))
% plot(th,h(th))