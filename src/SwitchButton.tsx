type Props = {
    onChange: () => void;
}

function SwitchButton({ onChange }: Props) {
    return <>
        <input id="reactSwitchButtonID" className="ts-input" type="checkbox" onChange={() => onChange()} />
        <label htmlFor="reactSwitchButtonID" className="ts-helper" title="" ></label>
    </>

};
export default SwitchButton;