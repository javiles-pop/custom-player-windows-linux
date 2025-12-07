import React from 'react';
import { Logger } from '../../../Util';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';

type CombinedShimMenuRowProps = ShimMenuRowProps & RouteComponentProps<any>;

function ShimMenuRow({
  name,
  iconPath,
  badged = false,
  detailText,
  textColor = '',
  onClickNavPath = '',
  history,
}: CombinedShimMenuRowProps) {
  function navigateToDetailsPage(name: string) {
    history.push(`/${name}`);
  }

  return (
    <button
      className="shim-menu-row"
      id={`shim-menu-row__${name.toLowerCase().replace(/ /g, '-')}`}
      data-navigable={true}
      onClick={() => {
        navigateToDetailsPage(onClickNavPath);
        Logger.debug(`user clicked the ${name} main menu item`);
      }}
    >
      <div className={classNames(['icon', { badged: badged }])}>
        <img src={iconPath} alt={name} />
      </div>
      <div className="title">{name}</div>
      <div className="details">
        <span className={classNames(['detail-text', textColor])}>{detailText}</span>
        <span className="nav-hint">&rang;</span>
      </div>
    </button>
  );
}

export default withRouter(ShimMenuRow);
