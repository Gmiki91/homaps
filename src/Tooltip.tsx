import { ReactNode } from 'react';

type Props = {
  text: string,
  children: ReactNode
}
function Tooltip({ text, children }: Props) {

  return (
    <div className="tooltip">
      {children}
      <div className="bubble_container">
        <span className='text'>{text}</span>
      </div>
    </div>
  );
}

export default Tooltip;