angular.module('app',['ui.bootstrap.contextMenu']).controller('appController', ['$scope', function($scope){
	/**
	 * 加入到undo数组中
	 **/
	$scope.appendToUndoArr = function(){
		var undoTableTitles =  jQuery.extend(true, {}, $scope.tableTitles); 
		$scope.undoArr.push(undoTableTitles);
		isUndoArr = false;
	}
	/**
	 * 右键操作
	 */
	$scope.menuOptions = [
						  ['往上增加行', function ($itemScope) {
							  $scope.addRow();
						  }], 
						  null,
						  ['删除当前行', function ($itemScope) {
							  $scope.delCurrentRow();
						  }],
						  null,
						  ['合并单元格', function ($itemScope) {
							  $scope.mergeCell();
						  }],
						  null,
						  ['拆分单元格', function ($itemScope) {
							  $scope.splitCell();
						  }],
						  null,
						  ['删除当前列', function ($itemScope) {
							  $scope.removeColumns();
						  }],
						  null,
						  
						  ['添加左列', function ($itemScope) {
							  $scope.appendColumns(-1);
						  }],
						  null,
						  ['添加右列', function ($itemScope) {
							  $scope.appendColumns(1);
						  }],
						  null,
						  
						  ['撤消表格操作', function ($itemScope) {
							  $scope.undo();
						  }],
					  ];

	$scope.undoArr = new Array();
	$scope.isUndoArr = false;
	$scope.tableTitles = {
			rows:[
					{row:[{title:'v11',colspan:2},{title:'v12'}]},
					{row:[{title:'v21',rowspan:2},{title:'v22'},{title:'v23'}]},
					{row:[{title:'v32'},{title:'v33'}]},
					{row:[{title:'v41',colspan:2,rowspan:2},{title:'v42'}]},
					{row:[{title:'v43'}]}
			]
	}

	/**
	 * 撤消操作
	 **/
	$scope.undo = function(){
		if($scope.undoArr.length>0 && !isUndoArr ){
			$scope.undoArr.pop();
			isUndoArr = true;
		}
		if($scope.undoArr.length>0){
			$scope.tableTitles = $scope.undoArr.pop();
		}else{
			alert("已经没有缓存可以撤消");
		}
	}
	
	/**
	 * 根据virtualTableTitles返回第一个与最后一个cell
	 **/
	$scope.getHeadTailSelectedCell = function(virtualTableTitles){
		var result = new Array();
		var first = null;
		var last = new Array(2);
		for(var rowIdx in virtualTableTitles.rows){
			for(var colIdx in virtualTableTitles.rows[rowIdx].row){
				if(virtualTableTitles.rows[rowIdx].row[colIdx].vSelected == 1){
					if(first == null){
						first = new Array(2);
						first[0] = rowIdx;
						first[1] = colIdx;
					}
					last[0] = rowIdx;
					last[1] = colIdx;
				}
			}
		}
		result.push(first);
		result.push(last);
		return result;
	}
	
	/**
	 * 返回需要添加的列的位置
	 **/
	$scope.getAppendColIdx = function(virtualTableTitles,num,isAppend){
		var result = null;
		var curColIdx = null;
		var isSameColIdx = true;
		for(var rowIdx in virtualTableTitles.rows){
			for(var colIdx in virtualTableTitles.rows[rowIdx].row){
				if(virtualTableTitles.rows[rowIdx].row[colIdx].vSelected == 1){
					if(result == null || (num<0 && colIdx<result) || (num>0 && colIdx>result)){
						result = colIdx;
					}
					if(curColIdx!=null && curColIdx != colIdx){
							isSameColIdx = false;
					}
					curColIdx = colIdx;
					
				}
			}
		}
		if(num>0 && isAppend){
			result ++;
		}
		/*if(n!isAppend){
			result --;
			if(result<0){
				result=0;
			}
		}*/
		//如果非添加列模式，且当前选中单元格非同列,result标记为-99
		if(!isSameColIdx && !isAppend){
			result = -99;
		}
		return result;
	}
	
	/**
	 * 为virtualTableTitles 打上原来信息标记
	 **/
	$scope.markTableTitlesRowAndColInfo = function(virtualTableTitles){
		for(var rowIdx in virtualTableTitles.rows){
			for(var colIdx in virtualTableTitles.rows[rowIdx].row){
				virtualTableTitles.rows[rowIdx].row[colIdx].mcol=colIdx;
				var colspan = virtualTableTitles.rows[rowIdx].row[colIdx].colspan||1;
				var rowspan = virtualTableTitles.rows[rowIdx].row[colIdx].rowspan||1;
				if(colspan>1){
					virtualTableTitles.rows[rowIdx].row[colIdx].mcolspan = colspan;
				}
				if(rowspan>1){
					virtualTableTitles.rows[rowIdx].row[colIdx].mrowspan = rowspan;
				}
			}
		}
	}
	
	/**
	 * 删除列的方法
	 **/
	$scope.removeColumns = function(){
		var colLen = $scope.getColLen();
		//返回鼠标选中单元格的数组位置
		var selectedArr = $scope.getSelectedCells(colLen,true);
		var isMultiColspan = false;
		if(selectedArr != 0 && selectedArr.length>0){
			for(var selectIdx = 0; selectIdx<selectedArr.length;selectIdx++){
				var selectedColspan = $scope.tableTitles.rows[selectedArr[selectIdx][0]].row[selectedArr[selectIdx][1]].colspan||1;
				if(selectedColspan>1){
					isMultiColspan = true;
					break;
				}
			}
			
			var virtualTableTitles = jQuery.extend(true, {}, $scope.tableTitles); 
			$scope.markTableTitlesRowAndColInfo(virtualTableTitles);
			$scope.splitCellByArr(virtualTableTitles,null,true);
			var returnCellIdx = $scope.getAppendColIdx(virtualTableTitles,1,false);
			if(isMultiColspan){
				alert("暂时不支持需要删除的列含有包含列!");
			}else if(returnCellIdx>-1){
				for(var rowIdx = 0;rowIdx<virtualTableTitles.rows.length;rowIdx++){
					var rowNode = virtualTableTitles.rows[rowIdx];
					for(var colIdx = 0;colIdx<rowNode.row.length;colIdx++){
						//实际存在的数组
						if(rowNode.row[colIdx].mcol){
							var markColIdx = parseInt(rowNode.row[colIdx].mcol,10);						
							var colspan = rowNode.row[colIdx].mcolspan||1;
							var rowspan = rowNode.row[colIdx].mrowspan||1;
							//当前是删除列，且colspan = 1
							if(colIdx == returnCellIdx && colspan == 1){
								$scope.tableTitles.rows[rowIdx].row.splice(markColIdx,1);
								break;
							}else if(colIdx == returnCellIdx && colspan>1){
								$scope.tableTitles.rows[rowIdx].row[markColIdx].colspan = colspan-1;
							}else if((colIdx + colspan) > returnCellIdx && returnCellIdx>colIdx){
								$scope.tableTitles.rows[rowIdx].row[markColIdx].colspan = colspan-1;
								if(rowspan>1){
									rowIdx += (rowspan-1);
								}
								break;
							}
						}else{
							if(colIdx==returnCellIdx){
								break;
							}
						}
					}
				}
				$scope.finishCellOperation();
			}else{
				alert("所选择的列必须是同一列!");
			}
			
			$scope.cleanAllSelected($scope.tableTitles);	
		}else{
			alert("请选择列!");
		}
		$scope.cleanSelectdClass();
	}
	
	/**
	 * 添加列的方法
	 **/
	$scope.appendColumns = function(num){
		var colLen = $scope.getColLen();
		//返回鼠标选中单元格的数组位置
		var selectedArr = $scope.getSelectedCells(colLen,true);
		if(selectedArr != 0 && selectedArr.length>0){
			var virtualTableTitles = jQuery.extend(true, {}, $scope.tableTitles); 
			$scope.markTableTitlesRowAndColInfo(virtualTableTitles);
			$scope.splitCellByArr(virtualTableTitles,null,true);
			var returnCellIdx = $scope.getAppendColIdx(virtualTableTitles,num,true);
			for(var rowIdx = 0;rowIdx<virtualTableTitles.rows.length;rowIdx++){
				var rowNode = virtualTableTitles.rows[rowIdx];
				//当前一行中,最近一个实际存在的cell的位置
				var nearMarkColIdx = null; 
				for(var colIdx = 0;colIdx<rowNode.row.length;colIdx++){
					if(returnCellIdx ==0 && colIdx == 0){
						$scope.tableTitles.rows[rowIdx].row.splice(0,0,{title:''});
						break;
					}else{
						//实际存在的数组
						if(rowNode.row[colIdx].mcol){
							var markColIdx = parseInt(rowNode.row[colIdx].mcol,10);						
							var colspan = rowNode.row[colIdx].mcolspan||1;
							var rowspan = rowNode.row[colIdx].mrowspan||1;
							nearMarkColIdx = markColIdx;
							if((colIdx + colspan) == returnCellIdx){
								$scope.tableTitles.rows[rowIdx].row.splice((markColIdx+1),0,{title:''});
								break;
							}else if((colIdx + colspan) > returnCellIdx){
								$scope.tableTitles.rows[rowIdx].row[markColIdx].colspan = colspan+1;
								if(rowspan>1){
									rowIdx += (rowspan-1);
								}
								break;
							}
						}
						else{
							if((colIdx+1)==returnCellIdx){
								if(nearMarkColIdx){
									$scope.tableTitles.rows[rowIdx].row.splice((nearMarkColIdx+1),0,{title:''});
								}else{
									$scope.tableTitles.rows[rowIdx].row.splice(0,0,{title:''});
								}
								break;
							}
						}
				}
					
				}
			}
			$scope.cleanAllSelected($scope.tableTitles);	
			$scope.finishCellOperation();
		}else{
			alert("请选择列!");
		}
		
		$scope.cleanSelectdClass();
	}
	
	/**
	 * 验证用户选择区域是否完全等于最终需要合并的区域大小
	 **/
	$scope.validateSelectedCell = function(tableTitles,oldSelectedArr){
		var result = null;
		if(oldSelectedArr != null && oldSelectedArr.length>0){
			var virtualTableTitles = jQuery.extend(true, {}, tableTitles); 
			$scope.splitCellByArr(virtualTableTitles,null,true);
			var headTailCellArr = $scope.getHeadTailSelectedCell(virtualTableTitles);
			//检查所选单元格是否等于最终合并结果单元格
			var firstSelectedCell = headTailCellArr[0];
			var lastSelectedCell = headTailCellArr[1];
			var leftIdx = parseInt(firstSelectedCell[1],10);
			var topIdx = parseInt(firstSelectedCell[0],10);
			var rightIdx = parseInt(lastSelectedCell[1],10);
			var bottomIdx =parseInt(lastSelectedCell[0],10);
			var maxLeftRowspan = 0;
			var maxTopColspan = 0;
			var maxRightRowspan = 0;
			var maxBottomColspan = 0;
			var outOfRange = false;
			
			for(var rowIdx in virtualTableTitles.rows){
				for(var colIdx in virtualTableTitles.rows[rowIdx].row){
					var vSelected = virtualTableTitles.rows[rowIdx].row[colIdx].vSelected;
					if(vSelected == 1){
						//统计maxTopColspan
						if(rowIdx == topIdx){
							maxTopColspan++;
						}
						//统计maxButtomColspan
						if(rowIdx == bottomIdx ){
							maxBottomColspan++;
						}
						//统计maxLeftRowspan
						if(colIdx == leftIdx){
							maxLeftRowspan++;
						}
						//统计maxRigthRowspan
						if(colIdx == rightIdx){
							maxRightRowspan++;
						}
						//超出范围
						if(topIdx>rowIdx || bottomIdx<rowIdx || leftIdx>colIdx || rightIdx<colIdx){
							console.log(topIdx>rowIdx);
							console.log(bottomIdx<rowIdx);
							console.log(leftIdx>colIdx);
							console.log(rightIdx<colIdx);
							console.log("topIdx:"+ topIdx+",rowIdx:"+rowIdx+",bottomIdx:"+bottomIdx+",leftIdx:"+leftIdx+",colIdx:"+colIdx + ",rightIdx:"+rightIdx);
							outOfRange = true;
						}
					}
				}
				if(outOfRange){
					break;
				}
			}
			
			if(maxRightRowspan == maxLeftRowspan && maxTopColspan == maxBottomColspan && !outOfRange){
				result = new Array(2);
				result[0] = maxRightRowspan;
				result[1] = maxTopColspan;
			}else{
				alert('你选择的单元格组与合并后的大小不一致，建议重新选择后，再合并 ');
			}
		}
		
		return result;
	}
	
	/**
	 * 执行合并单元格方法
	 **/
	$scope.mergeCell = function(){
		var colLen = $scope.getColLen();
		//返回鼠标选中单元格的数组位置
		var selectedArr = $scope.getSelectedCells(colLen,true);
		var rowColspan = $scope.validateSelectedCell($scope.tableTitles,selectedArr);
		
		if(rowColspan!=null){
			var firstSelectedCell = selectedArr[0];
			var titleVal = $scope.tableTitles.rows[firstSelectedCell[0]].row[firstSelectedCell[1]].title;
			//以下执行合并 删除
			if(selectedArr.length>1){
				for(var delIdx = (selectedArr.length-1);delIdx >0;delIdx--){
					if(titleVal.length==0){
						titleVal = $scope.tableTitles.rows[selectedArr[delIdx][0]].row[selectedArr[delIdx][1]].title;
					}
					$scope.tableTitles.rows[selectedArr[delIdx][0]].row.splice(selectedArr[delIdx][1],1);//[selectedArr[delIdx][1]];
				}
				$scope.tableTitles.rows[firstSelectedCell[0]].row[firstSelectedCell[1]].rowspan = rowColspan[0];
				$scope.tableTitles.rows[firstSelectedCell[0]].row[firstSelectedCell[1]].colspan = rowColspan[1];
				$scope.tableTitles.rows[firstSelectedCell[0]].row[firstSelectedCell[1]].title = titleVal;
			}
			$scope.cleanSelectdClass();
		}
		$scope.cleanAllSelected($scope.tableTitles);
		$scope.finishCellOperation();
	}
	
	/**
	 * 清除selected标记
	 **/
	$scope.cleanAllSelected = function(tableTitles){
		for(var rowIdx in tableTitles.rows){
			for(var colIdx in tableTitles.rows[rowIdx].row){
				if(tableTitles.rows[rowIdx].row[colIdx].selected){
					delete tableTitles.rows[rowIdx].row[colIdx]['selected'];
				}
			}
		}
	}
	
	/**
	 * 完成当前表格操作收尾工作
	 **/
	$scope.finishCellOperation = function(){
		//console.log(JSON.stringify($scope.tableTitles));
		$scope.appendToUndoArr();
		//if($scope.undoArr.length>15){
		//	$scope.undoArr.splice(0,1);
		//}
		//$scope.cleanEditPane();
	}
	
	/**
	 * 按指定的数组拆分单元格
	 **/
	$scope.splitCellByArr = function(tableTitlesJson,selectedArr,markSign){
		for(var rowIdx = 0;rowIdx<tableTitlesJson.rows.length;rowIdx++){
			for(var colIdx = 0;colIdx< tableTitlesJson.rows[rowIdx].row.length;colIdx++){
				//取出已选择的selected标识
				var isSelected = tableTitlesJson.rows[rowIdx].row[colIdx].selected;	
				var selectedVal = isSelected?1:0;
				//当前单元格是选中或者有markSign标记的情况下拆单元格
				if(isSelected || (markSign && tableTitlesJson.rows[rowIdx].row[colIdx].vSelected==null)){
					//当前需要拆分的数组位置
					var splitTitleObj = tableTitlesJson.rows[rowIdx].row[colIdx];
					var splitRowSpan = splitTitleObj.rowspan||1;
					var splitColSpan = splitTitleObj.colspan||1;
					//取当前的rowspan,并循环处理
					for(var rowSpanIdx = 0;rowSpanIdx<splitRowSpan;rowSpanIdx++){
						var modifyRowIdx = parseInt(rowIdx,10)+rowSpanIdx;
						//如果是合并 第一行,则colSpanIdx从1开始
						var colSpanIdx = (rowSpanIdx==0)?1:0;
						for(;colSpanIdx<splitColSpan;colSpanIdx++){
							var newTitleJson = null;
							//var addPosition = parseInt(colIdx,10)-(rowSpanIdx==0?1:0);
							var addPosition = parseInt(colIdx,10)+colSpanIdx;
							if(addPosition<0){
								addPosition = 1;
							}
							if(markSign){
								newTitleJson = {title:'',vSelected:selectedVal};
							}else{
								newTitleJson = {title:''}; 
							}
							if(addPosition<0){
								console.log("position is :"+addPosition);
							}
							tableTitlesJson.rows[modifyRowIdx].row.splice(addPosition,0,newTitleJson);
						}
						if(rowSpanIdx==0){
							var modifyTitleObj = tableTitlesJson.rows[modifyRowIdx].row[colIdx];
							modifyTitleObj.colspan = 1;
							modifyTitleObj.rowspan = 1;
							delete modifyTitleObj['selected'];
							
							if(markSign){
								modifyTitleObj.vSelected = selectedVal;
							}
						}
					}
				}
			}
		}
	}
	
	/**
	 * 执行拆分单元格方法
	 **/
	$scope.splitCell = function(){
		var colLen = $scope.getColLen();
		//返回鼠标选中单元格的数组位置
		var selectedArr = $scope.getSelectedCells(colLen,true);
		$scope.splitCellByArr($scope.tableTitles,selectedArr);
		$scope.cleanSelectdClass();
		$scope.finishCellOperation();
	}
		
	/**
	 * 执行向上添加一行方法
	 **/
	$scope.addRow = function(){
		var colLen = $scope.getColLen();
		var selectedArr = $scope.getSelectedCells(colLen,false);
		if(selectedArr !=null && selectedArr.length>0){
			var curRowIdx = selectedArr[0][0];
			var blankRow = {row:[]};
			for(var newIdx=0;newIdx<colLen;newIdx++){
				blankRow.row.push({title:''});
			}
			$scope.tableTitles.rows.splice(curRowIdx,0,blankRow);
			$scope.cleanSelectdClass();
		}else{
			alert('请选择行');
		}
		$scope.finishCellOperation();
	}
	
	/**
	 * 执行删除当前行方法
	 **/
	 $scope.delCurrentRow = function(){
		var colLen = $scope.getColLen();
		var selectedArr = $scope.getSelectedCells(colLen,false);
		var curRow=null;
		var colsCount = 0;
		var hasMultiRow = false;
		if(selectedArr!=null && selectedArr.length>0){
			for(var selectedIdx =0;selectedIdx<selectedArr.length;selectedIdx++){
				if(curRow == null){
					curRow = selectedArr[selectedIdx][0];
				}
				if(curRow != selectedArr[selectedIdx][0]){
					alert("选择单元格必须为同一行，才允许删除行");
					return;
				}
			}
			//统计当前行的列
			for(var colIdx = 0;colIdx<$scope.tableTitles.rows[curRow].row.length;colIdx++){
				var colspan = $scope.tableTitles.rows[curRow].row[colIdx].colspan||1;
				var rowspan = $scope.tableTitles.rows[curRow].row[colIdx].rowspan||1;
				colsCount += colspan;
				if(rowspan>1){
					hasMultiRow = true;
				}
			}
			//console.log("列数:"+colLen+";当前列数:"+colsCount);
			if(colLen != colsCount){
				alert("暂时删除行不支持合并列!");
			}else if(hasMultiRow){
				alert("删除行每一列都不能含有多行!");
			}else{
				$scope.tableTitles.rows.splice(curRow,1);
				$scope.cleanSelectdClass();
			}
		}else{
			alert('请选择行!');
		}
		$scope.finishCellOperation();
	}
	 
	
	
	/**
	 * 清除选择样式
	 **/
	$scope.cleanSelectdClass = function(){
		$(".ui-selected").removeClass("ui-selected");
	}
	
	/**
	 * 返回一行的单元格数量
	 **/
	$scope.getColLen = function(){
		var result = 0;
		if($scope.tableTitles.rows.length>0){
			var rowObj = $scope.tableTitles.rows[0];
			for(var rowIdx in rowObj.row){
				if(rowObj.row[rowIdx].colspan){
					result +=rowObj.row[rowIdx].colspan;
				}else{
					result++;
				}
			}
		}
		return result;
	}
	/**
	 * 返回选中的单元格数组位置
	 **/
	$scope.getSelectedCells = function(colLen,markSign){
		//选中数组
		var result = new Array();
		var tds = $("td", $("#tableTitle"));
		
		tds.filter(".ui-selected").each(function(){
            var tdsIdx = tds.index(this);
            var rowsObj = $scope.tableTitles.rows;
            //所有td的idx计算器
            var curTdIdx = 0;
            var isBreak = false;
            for(var rowIdx in rowsObj){
            	for(var colIdx in rowsObj[rowIdx].row){
            		if(curTdIdx==tdsIdx){
            			isBreak = true; 
            			var curSelectedArr = new Array(2);
            			curSelectedArr[0] = rowIdx;
            			curSelectedArr[1] = colIdx;
            			if(markSign){
            				rowsObj[rowIdx].row[colIdx].selected = 1;
            			}
            			result.push(curSelectedArr);
            			break;
            		}
            		curTdIdx ++;
            	}
            	if(isBreak){
            		break;
            	}
            }
        });
		return result;
	}	
		
	/**
	 * 用户拖拉选择标题栏结束后，触发事件
	 */
	$scope.showSelected = function(){
		var colLen = $scope.getColLen();
		var selectedArr = $scope.getSelectedCells(colLen,false);
	}
	
	$('#tableTitle').selectable({stop: $scope.showSelected})
		
	}]);
