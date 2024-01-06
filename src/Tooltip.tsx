
import { ReactNode } from 'react';

type Props={
    text:string,
    children:ReactNode
}
function Tooltip(props:Props) {
  const { text, children } = props;
  return (
    <div className="tooltip">
      {children}
      <span className="text">{text}</span>
    </div>
  );
}

export default Tooltip;