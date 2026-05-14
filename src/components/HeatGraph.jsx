export default function HeatGraph({list}){
    const today = new Date();

    function generateGraphData(year, month){
        const counts = {};
        list.forEach((app)=>{
            counts[app.date] = (counts[app.date] || 0) + 1;
        })

        const daysInMonth = new Date(year, month, 0).getDate();
        const result = [];

        for(let i = 0; i<=daysInMonth; i++){
            const date = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}.`;
            const toolTip = `${i} ${month}, ${count[date] || 0}`;
            result.push({
                toolTop,
                count: counts[date] || 0,
            })
        }
    }

    return (
        <div>Nimoda</div>
    )
}