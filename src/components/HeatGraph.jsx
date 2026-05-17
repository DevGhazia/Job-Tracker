import { Tracker, Card } from "@tremor/react";
import { formateDate, getDaysPassed, getMonthName } from "../constants";
import { useEffect, useState } from "react";

export default function HeatGraph({ list }) {

    const [width, setWidth] = useState(window.innerWidth);

    useEffect(()=>{
        function handleResize(){
            setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        return ()=> window.removeEventListener('resize', handleResize);
    }, []);

    function getLevel(count) {
        if (count === 0) return 'level-0';
        if (count <= 4)  return 'level-1';
        if (count <= 9)  return 'level-2';
        return 'level-3';
    }

    function getCutOffDaysCount(){
        let count = 60;
        if(width <= 450) count = 20;
        else if(width <= 640) count = 30; 
        else if(width <= 800) count = 45;
        return count;
    }

    function generateGraphData() {
        const result = [];
        const counts = {};
        const today = new Date();
        let peakDayDate = "";
        let maxCount = 0;

        const cutoffDate = new Date();
        cutoffDate.setDate(today.getDate() - getCutOffDaysCount());
        list.forEach((app) => {
            counts[app.date] = (counts[app.date] || 0) + 1;
            if(counts[app.date] > maxCount){
                maxCount = counts[app.date];
                peakDayDate = app.date;
            }
        });
        let rollingDate = new Date(cutoffDate);
        while (rollingDate <= today) {
            const dateStr = rollingDate.toISOString().split('T')[0];
            const count = counts[dateStr] || 0;
            result.push({
                date: new Date(rollingDate),
                tooltip: `${rollingDate.getDate()} ${getMonthName(rollingDate)}, Applied: ${count}`,
                color: getLevel(count), 
                count: count
            });
            rollingDate.setDate(rollingDate.getDate() + 1);
        }
        return {result, maxCount, peakDayDate};
    }

    const {result, maxCount, peakDayDate} = generateGraphData();

    function calculateStreak(){
        if(!result.length) return 0;

        let streak = 0;
        let index = result.length - 1;

        // get the last updated day
        while(!result[index].count && index > 0){ index--; } 
        if(getDaysPassed(result[index].date) > 1) return 0;

        for(let i = index; i>=0; i--){
            if(result[i].count > 0) streak++;
            else break;
        }
        return streak;
    }

    const streakCount = calculateStreak();

    if(!list.length) return;

    return (
        <section className="section-heatmap">
            <div>
                <h2>Activity Map</h2>
                <small>Visual timeline for the applications sent</small>
            </div>
            <div className="card graph-container">
                <div className="graph-stats-container">
                    <div>
                        <span>🔥 Current streak : </span>
                        <span>{`${streakCount} ${streakCount === 1? "day" : "days"}`}</span>
                    </div>
                    <div>
                        <p>{`⚡ Peak acitivity : 
                            ${maxCount} ${maxCount > 0? "applications" : "job"} 
                            (${formateDate(peakDayDate)})`}
                        </p>
                    </div>
                </div>
                <Tracker 
                    data={result} 
                    className="heat-graph" 
                />
                <div className="graph-subtext-wrapper">
                    <small>{getCutOffDaysCount()} days ago</small>
                    <small>Today</small>
                </div>
            </div>
        </section>
    );
}