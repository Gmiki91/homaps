import { confirm } from '@tauri-apps/api/dialog';
import { ReactNode } from 'react';

type Props = {
  text: string,
  empty: boolean,
  children: ReactNode
  remove: () => void
}
function Tooltip({ text, empty, children, remove }: Props) {

  const onRemove = async () => {
    const confirmation = await confirm('Are you sure you wish to delete this item?');
    if (confirmation) {
      remove();
    }
  }

  return (
    <div className="tooltip">
      {children}
      <div className="bubble_container">
        <span className='text'>{text}</span>
        {empty ? null : <span className="delete_btn" onClick={onRemove}>&#x2718;</span>}
      </div>
    </div>
  );
}

export default Tooltip;