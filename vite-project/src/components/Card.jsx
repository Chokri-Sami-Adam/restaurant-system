const Card = ({ title, value, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-4 rounded-full ${colorClass}`}>
        {Icon && <Icon className="w-8 h-8" />}
      </div>
    </div>
  );
};

export default Card;
