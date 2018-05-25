class DialogflowUtils {

    static parseUserInfo(agent) {
        let result = {
            source: agent.originalRequest.source
        };
        switch(agent.originalRequest.source) {
            case 'slack':
                let payload = agent.originalRequest.payload; 
                result.info = {
                    channel: payload.channel ? payload.channel.id : payload.event.channel,
                    userid: payload.user ? payload.user.id :payload.event.user
                }
            break;
            
            default:
            break;
        }
        return result;
    }



}

module.exports = DialogflowUtils;